export interface ProductAnalysis {
  productType: string;
  description: string;
  dominantColors: string[];
  style: string;
  suggestedPrompts: string[];
}

export interface GenerationResult {
  imageUrl: string;
  strategy: string;
  strategyReason: string;
  adHeadline: string;
  adSubtext?: string;
  dallePrompt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
