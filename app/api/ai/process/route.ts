import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are "TripWise AI". 
You structure chaotic group chats into a JSON trip itinerary. 
You will receive the CURRENT TRIP STATE and RECENT CHAT MESSAGES. 
You MUST respond EXCLUSIVELY with a JSON object. No markdown wrapping.

CRITICAL INSTRUCTION FOR 'message' FIELD: 
This is your chat reply to the group. Make it highly conversational, fun, and interactive! 
- ALWAYS ask brief follow-up questions to gather missing preferences (e.g. "Do you prefer luxury or budget?" or "Any specific beaches in Puri?").
- Offer 1-2 quick relevant fun facts or suggestions about the destination.
- DO NOT just say "I updated the plan". Act like a real human travel agent chatting with friends.
- If the users explicitly prompt you NOT to give extra info, then just provide a very brief confirmation.
- CRITICAL: ALWAYS fill in 'destination', 'dates', and 'budget' in the 'tripStateUpdates' below if they are mentioned or deduced from the chat! Do not leave them null if you know them.
- CRITICAL LOGISTICS: When a user asks for an itinerary "from X to Y", assume X is their hometown/starting point. DO NOT include arriving, roaming around, or spending a day in X unless explicitly requested. Start the actual vacation activities upon arrival in Y.

CURRENCY & PRICING:
- ALWAYS use ₹ (Rupees) for all currency mentions.
- If the user discusses budget, provide a detailed price breakdown in the 'budget' field (e.g., "Total: ₹40,000 (Flights: ₹15k, Stay: ₹20k, Food: ₹5k)").
- In the 'itinerary', include estimated costs for activities if possible (e.g., "Visit Amber Fort (₹500 entry fee)").

JSON Schema:
{
  "message": "Your fun, interactive, question-asking chat message here",
  "tripStateUpdates": {
    "destination": "New Destination or null if unchanged",
    "dates": "Dates string or null if unchanged",
    "budget": "Detailed budget breakdown with ₹ or null if unchanged",
    "preferences": ["tag1", "tag2"] or null,
    "itinerary": [
      { "day": 1, "title": "Day title", "activities": ["act 1 (₹cost)", "act 2"] }
    ] or null
  }
}`;

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { groupId, senderId } = data;

    // AI Rate Limiting (5 requests per min max)
    const userLimit = await redis.incr(`rate:ai:${senderId}`);
    if (userLimit === 1) await redis.expire(`rate:ai:${senderId}`, 60);
    if (userLimit > 5) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    // Push prompt to Queue
    await redis.lpush(`queue:ai:${groupId}`, JSON.stringify(data));

    // Simple Lock system to ensure only 1 worker processes per group at a time
    const locked = await redis.set(`lock:ai:${groupId}`, "1", "EX", 30, "NX");
    if (!locked) {
      return NextResponse.json({ queued: true });
    }

    // Process the queue synchronously in serverless
    await processQueue(groupId);

    return NextResponse.json({ success: true, processed: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function processQueue(groupId: string) {
  try {
    while (true) {
      const item = await redis.rpop(`queue:ai:${groupId}`);
      if (!item) break; // queue empty

      const promptData = JSON.parse(item);

      // Fetch Context
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { tripState: true }
      });
      const recentMessages = await prisma.message.findMany({
        where: { groupId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { content: true, sender: { select: { name: true } } }
      });

      // Format for Groq
      const historyStr = recentMessages.reverse().map(m => `${m.sender?.name || 'User'}: ${m.content}`).join("\n");
      const currentStateStr = JSON.stringify(group?.tripState || {});

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `CURRENT STATE:\n${currentStateStr}\n\nRECENT CHAT (Last 30):\n${historyStr}\n\nLATEST PROMPT TO PROCESS:\n${promptData.content}` }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(responseContent);

      // 1. Update Trip State
      if (parsed.tripStateUpdates) {
        const updates = parsed.tripStateUpdates;
        const validUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== null));
        
        if (Object.keys(validUpdates).length > 0) {
          if (group?.tripState) {
            await prisma.tripState.update({
              where: { id: group.tripState.id },
              data: validUpdates
            });
          } else {
            await prisma.tripState.create({
              data: {
                groupId,
                ...validUpdates,
                preferences: validUpdates.preferences || [],
                itinerary: validUpdates.itinerary || []
              }
            });
          }
        }
      }

      // 2. Save AI message to DB
      const aiMessage = await prisma.message.create({
         data: {
           groupId,
           content: parsed.message || "I updated the trip plan based on your request.",
           type: "ai"
         }
      });

      // 3. Emit back via Socket.js (internal ping)
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://localhost:3000`;
      await fetch(`${socketUrl}/api/internal/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "receive_message",
          groupId,
          data: {
            id: aiMessage.id,
            groupId,
            senderId: null,
            content: aiMessage.content,
            type: "ai",
            timestamp: new Date().toISOString()
          }
        })
      });

      // Trigger state re-fetch ping
      await fetch(`${socketUrl}/api/internal/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "trip_state_updated", groupId })
      });
    }
  } finally {
    await redis.del(`lock:ai:${groupId}`);
  }
}
