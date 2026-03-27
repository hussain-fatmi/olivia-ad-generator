import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatMessage } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseJSONResponse(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  return JSON.parse(cleaned.trim());
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationHistory = [],
      productType,
      productDescription,
    } = await request.json();

    if (!message || !productType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const messages: any[] = [
      {
        role: "system",
        content: `You are an AI creative assistant helping refine product ads. The user is working with a ${productType}.

When the user asks for changes or refinements:
- If it requires regenerating the image (background, style, scene changes), respond with a newPrompt
- If it's just a question or discussion, respond without a newPrompt

Return valid JSON:
{
  "reply": "your conversational response",
  "newPrompt": "detailed prompt for regeneration (or null if no regeneration needed)"
}`,
      },
      {
        role: "user",
        content: `Product: ${productType}
Description: ${productDescription}

Conversation history:
${conversationHistory
  .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
  .join("\n")}

User's new message: ${message}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const chatResponse = parseJSONResponse(content);

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
