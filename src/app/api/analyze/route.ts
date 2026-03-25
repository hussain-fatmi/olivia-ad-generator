import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ProductAnalysis } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image and provide:
1. Product type (e.g., "Coffee Mug", "Sneakers", "Skincare Product")
2. Detailed description of the product
3. Dominant colors (2-3 colors)
4. Visual style (e.g., "minimalist", "vintage", "luxury")
5. Three creative ad prompt suggestions tailored to this product

Return your response as valid JSON with this exact structure:
{
  "productType": "...",
  "description": "...",
  "dominantColors": ["color1", "color2"],
  "style": "...",
  "suggestedPrompts": ["prompt1", "prompt2", "prompt3"]
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const analysis: ProductAnalysis = JSON.parse(content);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
