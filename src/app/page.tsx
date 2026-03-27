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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-violet-600" />
            AdGen
          </h1>
          <p className="text-gray-400">
            AI-Powered Product Ad Generator
          </p>
        </header>

        {state === "idle" && (
          <div className="max-w-2xl mx-auto">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-violet-600 hover:bg-violet-950/20 transition-all duration-300 cursor-pointer group"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="mx-auto mb-4 text-gray-600 group-hover:text-violet-500 transition-colors duration-300" size={48} />
                <p className="text-lg mb-2 group-hover:text-violet-300 transition-colors">
                  Drop your product image here
                </p>
                <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                  or click to browse
                </p>
              </label>
            </div>
          </div>
        )}

        {state === "analyzing" && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900 border-gray-800 p-8 text-center">
              <Loader2 className="mx-auto mb-4 animate-spin text-violet-600" size={48} />
              <p className="text-lg">Analyzing your product...</p>
            </Card>
          </div>
        )}

        {(state === "ready" || state === "generating" || state === "done") && analysis && (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left Side - Image */}
            <div className="w-full md:w-1/2 md:max-w-[50%]">
              <Card className="bg-gray-900 border-gray-800 p-6 md:sticky md:top-8">
                <div className="relative w-full max-h-[70vh] bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={result?.imageUrl || imagePreview}
                    alt={result ? "Generated Ad" : "Product"}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              </Card>
            </div>

            {/* Right Side - Controls */}
            <div className="w-full md:w-1/2 md:max-w-[50%] space-y-6">
              {state !== "done" && (
                <>
                  {/* Product Info */}
                  <Card className="bg-gray-900 border-gray-800 p-6">
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

                  {/* Suggested Prompts */}
                  {state === "ready" && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">
                        Suggested prompts:
                      </p>
                      {analysis.suggestedPrompts.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-violet-600 hover:bg-gray-800/50 transition-all duration-200 flex items-center justify-between group hover:shadow-md hover:shadow-violet-500/20 hover:scale-[1.01]"
                        >
                          <span className="text-sm group-hover:text-violet-300 transition-colors">{suggestion}</span>
                          <ChevronRight className="text-gray-600 group-hover:text-violet-500 transition-all duration-200 group-hover:translate-x-1" size={16} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Prompt Input */}
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
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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

              {/* After Generation - Replace with result info */}
              {state === "done" && result && (
                <>
                  <Card className="bg-gray-900 border-gray-800 p-6">
                    <div className="space-y-4">
                      <div>
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

                      <Separator className="bg-gray-800" />

                      <Button
                        variant="outline"
                        className="w-full border-gray-700 hover:bg-gray-800 hover:border-violet-500 hover:text-violet-400 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/20"
                        onClick={() => window.open(result.imageUrl, "_blank")}
                      >
                        <Download className="mr-2" size={16} />
                        Open Full Size
                      </Button>

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
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <Send size={16} />
                      </Button>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
