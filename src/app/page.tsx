"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Upload,
  Send,
  RefreshCw,
  Download,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { ProductAnalysis, GenerationResult, ChatMessage } from "@/types";

type AppState = "idle" | "analyzing" | "ready" | "generating" | "done";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");

  const handleImageUpload = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setImageBase64(base64);
        setImagePreview(base64);
        setState("analyzing");

        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });

          if (!response.ok) throw new Error("Analysis failed");

          const data: ProductAnalysis = await response.json();
          setAnalysis(data);
          setState("ready");
        } catch (error) {
          console.error("Analysis error:", error);
          setState("idle");
          alert("Failed to analyze image. Please try again.");
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleGenerate = async () => {
    if (!prompt || !analysis) return;

    setState("generating");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          productType: analysis.productType,
          productDescription: analysis.description,
          conversationHistory: chatMessages,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data: GenerationResult = await response.json();
      setResult(data);
      setState("done");

      setChatMessages([
        ...chatMessages,
        { role: "user", content: prompt },
        {
          role: "assistant",
          content: `Generated ad using ${data.strategy} strategy: ${data.adHeadline}`,
        },
      ]);
    } catch (error) {
      console.error("Generation error:", error);
      setState("ready");
      alert("Failed to generate ad. Please try again.");
    }
  };

  const handleChatMessage = async () => {
    if (!chatInput.trim() || !analysis) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput,
          conversationHistory: updatedMessages,
          productType: analysis.productType,
          productDescription: analysis.description,
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
      };
      setChatMessages([...updatedMessages, assistantMessage]);

      if (data.newPrompt) {
        setPrompt(data.newPrompt);
        setTimeout(() => handleGenerate(), 500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to process message. Please try again.");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-violet-600" />
            AdGen
          </h1>
          <p className="text-gray-400">
            AI-Powered Product Ad Generator
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {state === "idle" && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-violet-600 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 text-gray-600" size={48} />
                  <p className="text-lg mb-2">
                    Drop your product image here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse
                  </p>
                </label>
              </div>
            )}

            {state === "analyzing" && (
              <Card className="bg-gray-900 border-gray-800 p-8 text-center">
                <Loader2 className="mx-auto mb-4 animate-spin text-violet-600" size={48} />
                <p className="text-lg">Analyzing your product...</p>
              </Card>
            )}

            {(state === "ready" || state === "generating" || state === "done") && analysis && (
              <>
                <Card className="bg-gray-900 border-gray-800 p-6">
                  <img
                    src={imagePreview}
                    alt="Product"
                    className="w-full rounded-lg mb-4"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-violet-600 text-white">
                        {analysis.productType}
                      </Badge>
                      <Badge variant="outline" className="border-gray-700">
                        {analysis.style}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      {analysis.description}
                    </p>
                    <div className="flex gap-2">
                      {analysis.dominantColors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-gray-500">
                          <div className="w-4 h-4 rounded-full border border-gray-700" style={{ backgroundColor: color }} />
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {state === "ready" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">
                      Suggested prompts:
                    </p>
                    {analysis.suggestedPrompts.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-violet-600 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm">{suggestion}</span>
                        <ChevronRight className="text-gray-600 group-hover:text-violet-600" size={16} />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe your ad vision (e.g., 'lifestyle photo on a marble countertop' or 'summer Instagram ad with bold text')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-gray-900 border-gray-800 text-gray-100 min-h-[120px] resize-none"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt || state === "generating"}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {state === "generating" ? (
                      <>
                        <RefreshCw className="mr-2 animate-spin" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2" size={16} />
                        Generate Ad
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            {result && (
              <>
                <Card className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="relative">
                    <img
                      src={result.imageUrl}
                      alt="Generated ad"
                      className="w-full"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Badge className="bg-violet-600 text-white mb-2">
                          {result.strategy.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-gray-500 mb-3">
                          {result.strategyReason}
                        </p>
                        <h2 className="text-xl font-bold mb-1">
                          {result.adHeadline}
                        </h2>
                        {result.adSubtext && (
                          <p className="text-sm text-gray-400">
                            {result.adSubtext}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-700 hover:bg-gray-800"
                        onClick={() => window.open(result.imageUrl, "_blank")}
                      >
                        <Download className="mr-2" size={16} />
                        Open Full Size
                      </Button>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
                        DALL-E Prompt
                      </summary>
                      <p className="mt-2 text-gray-600 bg-gray-950 p-3 rounded">
                        {result.dallePrompt}
                      </p>
                    </details>
                  </div>
                </Card>

                <Card className="bg-gray-900 border-gray-800 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="text-violet-600" size={16} />
                    Refine Your Ad
                  </h3>

                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {chatMessages.slice(-6).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-violet-600/10 border border-violet-600/20 ml-8"
                            : "bg-gray-800 mr-8"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask for changes (e.g., 'make the background warmer', 'add a headline')"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleChatMessage();
                        }
                      }}
                      className="bg-gray-950 border-gray-800 text-gray-100 resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleChatMessage}
                      disabled={!chatInput.trim()}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {!result && state !== "idle" && (
              <Card className="bg-gray-900 border-gray-800 p-12 text-center">
                <Sparkles className="mx-auto mb-4 text-gray-700" size={48} />
                <p className="text-gray-500">
                  Your generated ad will appear here
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
