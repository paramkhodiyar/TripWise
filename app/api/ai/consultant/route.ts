import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are Saarthi, a highly specialized AI Travel Consultant. Your SOLE purpose is to help users plan trips, discuss destinations, estimate budgets, suggest itineraries, and evaluate the feasibility of travel plans.

STRICT RULES:
1. ONLY discuss travel-related topics (locations, culture, food, transport, budget, dates, weather, etc.).
2. If the user asks about ANY other topic (math, coding, software, general knowledge, sports, history NOT related to travel, etc.), you MUST politely refuse. Example: "I specialize only in travel planning. I can help you with your next trip, but I can't assist with [math/coding/etc.]."
3. Be professional, inspiring, and detailed.
4. Always provide prices in Indian Rupees (₹) since most of our users are from India.
5. If a user seems set on a plan, encourage them to click the "Create Trip" button to start a group.
6. Keep your responses concise yet helpful.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        }))
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Consultant AI Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
