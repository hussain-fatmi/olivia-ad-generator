# AdGen — AI-Powered Product Ad Generator

AdGen takes a product image and a natural language prompt and generates a polished creative ad using AI. It automatically detects your product, suggests creative directions, picks the right generation strategy, and lets you iterate conversationally until the result is exactly what you want.

Built as a take-home challenge for Ol## Features

- **Product auto-detection** — GPT-4o Vision analyzes the uploaded image and identifies the product type, style, and dominant colors
- **Prompt suggestions** — AI surfaces 3 tailored creative prompt ideas based on what it detects
- **Agentic strategy routing** — GPT-4o autonomously decides the best generation approach (background swap, full scene, or text overlay) based on your prompt — no dropdowns or manual selection
- **Ad copy generation** — AI writes a headline and supporting line to go with the image
- **Conversational iteration** — chat panel lets you refine the result naturally ("make it warmer", "try a dark background", "add bold text")
- **Strategy transparency** — the UI explains what approach the AI chose and why

---

## How It Works

```
Upload image
    │
    ▼
GPT-4o Vision → detects product type, suggests prompts
    │
    ▼
User writes prompt (or clicks a suggestion)
    │
    ▼
GPT-4o → picks strategy + writes optimized DALL-E prompt
    │
    ├── background_swap  →  product in a new environment
    ├── full_scene       →  editorial/lifestyle composition
    └── text_overlay     →  ad graphic with headline copy
    │
    ▼
DALL-E 3 → generates 1024×1024 image
    │
    ▼
Result shown with strategy badge + headline + chat panel
    │
    ▼
Chat → "make it warmer" → GPT-4o rewrites prompt → regenerates
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | lucide-react |
| AI — Vision & Routing | GPT-4o |
| AI — Image Generation | DALL-E 3 |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts        # GPT-4o Vision — product detection
│   │   ├── generate/
│   │   │   └── route.ts        # Strategy routing + DALL-E 3 generation
│   │   └── chat/
│   │       └── route.ts        # Conversational iteration
│   ├── layout.tsx
│   └── page.tsx                # Main UI — upload, canvas, chat panel
└── types/
    └── index.ts                # Shared TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys) with access to GPT-4o and DALL-E 3

### Installation

```bash
git clone https://github.com/yourusername/olivia-ad-generator
cd olivia-ad-generator
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=your_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Routes

### `POST /api/analyze`

Accepts a base64-encoded product image. Returns product metadata and prompt suggestions.

**Request**
```json
{ "imageBase64": "..." }
```

**Response**
```json
{
  "productType": "skincare bottle",
  "description": "A minimalist white serum bottle with a dropper cap",
  "dominantColors": ["white", "gold"],
  "style": "clean",
  "suggestedPrompts": [
    "marble countertop with soft morning light",
    "luxury bathroom flatlay with botanicals",
    "bold Instagram ad with pastel gradient background"
  ]
}
```

---

### `POST /api/generate`

Accepts a prompt + product context. GPT-4o selects a strategy and crafts an optimized DALL-E prompt. Returns the generated image URL and creative metadata.

**Request**
```json
{
  "prompt": "lifestyle photo on a marble countertop",
  "productType": "skincare bottle",
  "productDescription": "A minimalist white serum bottle",
  "conversationHistory": []
}
```

**Response**
```json
{
  "imageUrl": "https://...",
  "strategy": "background_swap",
  "strategyReason": "The prompt describes a specific setting, so I placed the product in that environment.",
  "adHeadline": "Your skin's new morning ritual",
  "adSubtext": "Pure ingredients. Effortless results.",
  "dallePrompt": "..."
}
```

---

### `POST /api/chat`

Accepts a user message + full conversation history. Returns a reply and an updated prompt. If `newPrompt` is non-null, the frontend re-calls `/api/generate` automatically.

**Request**
```json
{
  "message": "make the background warmer",
  "conversationHistory": [...],
  "productType": "skincare bottle",
  "productDescription": "..."
}
```

**Response**
```json
{
  "reply": "Warming up the background with golden hour tones.",
  "newPrompt": "marble countertop with warm golden hour sunlight streaming in"
}
```

---

## Deployment

This app is deployed on Vercel. API keys are stored as environment variables and never exposed to the client — all OpenAI calls happen server-side in API routes.

To deploy your own instance:

```bash
npm install -g vercel
vercel
```

Add `OPENAI_API_KEY` in your Vercel project's environment variable settings.

### Protecting the app

Since all generations consume OpenAI credits, it's recommended to:

- Set a **monthly spend cap** in your OpenAI billing settings
- Enable **Vercel Authentication** (Settings → Deployment Protection) to restrict access to invited users

---

## Design Decisions

**Why GPT-4o for strategy routing instead of a fixed dropdown?**
Having the AI decide which generation approach to use based on the user's natural language prompt is the core agentic behavior. It removes friction and demonstrates that the system understands intent, not just instructions.

**Why keep the UI to a single page?**
The brief asked for a clean, interactive UI with a canvas feel. A single focused layout keeps the user's attention on the creative output rather than navigation.

**Why pass full conversation history on every chat turn?**
DALL-E and GPT-4o are stateless. Passing the full history ensures iterative refinements are cumulative — "now make it darker" works correctly because the model knows what "it" refers to.

---

## License

MITivia.

