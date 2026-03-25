import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GenerationResult, ChatMessage } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      productType,
      productDescription,
      conversationHistory = [],
    } = await request.json();

    if (!prompt || !productType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const conversationContext =
      conversationHistory.length > 0
        ? `\n\nPrevious conversation:\n${conversationHistory
            .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
            .join("\n")}`
        : "";

    const strategyResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert ad creative strategist. Given a product and user prompt, you must:
1. Choose the best strategy: "background_swap", "full_scene", or "text_overlay"
   - background_swap: Replace/change the background while keeping the product focal
   - full_scene: Create a complete lifestyle/contextual scene with the product
   - text_overlay: Focus on bold text/graphics with the product
2. Write an optimized DALL-E 3 prompt (detailed, descriptive, specific)
3. Create an engaging ad headline
4. Optionally create ad subtext

Return valid JSON:
{
  "strategy": "background_swap|full_scene|text_overlay",
  "strategyReason": "brief explanation why",
  "dallePrompt": "detailed prompt for DALL-E",
  "adHeadline": "catchy headline",
  "adSubtext": "optional supporting text"
}`,
        },
        {
          role: "user",
          content: `Product Type: ${productType}
Product Description: ${productDescription}
User Request: ${prompt}${conversationContext}

Create the ad strategy and DALL-E prompt.`,
        },
      ],
      max_tokens: 1500,
    });

    const strategyContent = strategyResponse.choices[0].message.content;
    if (!strategyContent) {
      throw new Error("No strategy response from OpenAI");
    }

    const strategy = JSON.parse(strategyContent);

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: strategy.dallePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    const result: GenerationResult = {
      imageUrl,
      strategy: strategy.strategy,
      strategyReason: strategy.strategyReason,
      adHeadline: strategy.adHeadline,
      adSubtext: strategy.adSubtext,
      dallePrompt: strategy.dallePrompt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate ad" },
      { status: 500 }
    );
  }
}
