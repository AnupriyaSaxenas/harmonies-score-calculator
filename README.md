# 🌿 Harmonies Score Calculator

Upload photos of your [Harmonies](https://boardgamegeek.com/boardgame/414317/harmonies) board and cards, and a vision-capable AI model calculates your final score with a full breakdown.

**Live app:** https://anupriyasaxenas.github.io/harmonies-score-calculator/

Everything runs in your browser. Your API key and photos are **never stored or sent anywhere except directly to the AI provider you choose** — there is no backend.

---

## Quick start (using the hosted app)

1. Open the [live app](https://anupriyasaxenas.github.io/harmonies-score-calculator/).
2. Pick an **AI provider** and paste your **API key** (see [Getting an API key](#getting-an-api-key)).
3. Choose your **board side** (A = River, B = Islands).
4. **Upload your photos** (see [How to use](#how-to-use)).
5. Click **Calculate My Score**.

---

## Getting an API key

The app supports three providers — pick one from the dropdown and use a matching key. The key lives only in your browser tab for the session and is never saved.

| Provider | Cost | Where to get a key | Notes |
|---|---|---|---|
| **OpenRouter** | Free models available | [openrouter.ai/keys](https://openrouter.ai/keys) | Default. No credit card needed. Free vision models are lower accuracy. |
| **OpenAI (GPT-4o)** | Paid (pay-as-you-go) | [platform.openai.com](https://platform.openai.com/api-keys) | Most accurate. Needs API credit — **separate from a ChatGPT Plus subscription**. |
| **Google Gemini** | Free tier | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free tier availability varies by region. |

> **Tip:** For the most reliable card/board reading, GPT-4o is best. The free OpenRouter model is fine for a quick estimate but can miscount tiles or misread cards.

---

## How to use

### 1. Board side
Select **Side A (River)** or **Side B (Islands)** — this changes how blue (water) tokens are scored.

### 2. Board image *(required)*
Upload one photo of your personal board. Best results when:
- Taken from **directly above**
- **All hexes are visible** and well-lit
- Token stack heights are clear (tilt slightly if needed to show stack height)

### 3. Active Animal Cards *(optional, unlimited)*
Cards **still in play** above your board — some animal cubes placed, some not.
- Click the **➕ tile** to add a card; a new tile appears so you can add as many as you have.
- These are scored by **counting how many cubes you've placed** (removed from the card).
- Use **✕ Remove** on any tile to delete it.

### 4. Completed Animal Cards *(optional, unlimited)*
Finished cards set **beside** your board with **no cubes left** on them.
- Add as many as you have, same ➕ flow.
- Each completed card scores its **maximum** value. **Upload them here** so they're never miscounted as zero — this is the whole reason the section is separate.

### 5. Nature's Spirit Card *(optional)*
Upload your Nature's Spirit card if you used one. Its bonus is added to the total.

### 6. Calculate
Click **Calculate My Score**. You'll get a step-by-step analysis plus a final breakdown:

```
Trees / Mountains / Fields / Buildings / Water
Landscape Total
Animal Cards
Nature's Spirit
GRAND TOTAL
```

### Photo tips
- One card per upload tile, framed so the printed point values and any cubes are clearly visible.
- Avoid glare and shadows across the tokens.
- If the model flags uncertainty, re-shoot that card/board with better lighting or angle.

---

## Run locally

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install      # first time only
npm run dev      # start the dev server
```

Then open the URL it prints (it includes the `/harmonies-score-calculator/` path, e.g. `http://localhost:7823/harmonies-score-calculator/`).

Other commands:

```bash
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

---

## Deployment

The app auto-deploys to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`.

One-time setup in the repo:
1. The repository must be **public** (or on a GitHub plan that allows Pages on private repos).
2. **Settings → Pages → Build and deployment → Source → GitHub Actions**.

After that, each push to `main` rebuilds and redeploys automatically.

---

## How scoring works

Scoring rules are encoded in the system prompt (`src/prompt.js`); detailed rules and edge cases live in [`docs/scoring-rules.md`](docs/scoring-rules.md). The AI is instructed to flag uncertainty rather than guess, so review its breakdown for any cards or hexes it wasn't sure about.

## Tech

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- No backend — API calls go directly from the browser to the chosen provider
- Deployed on GitHub Pages

## Privacy

Your API key and uploaded images stay in your browser and are sent only to the AI provider you select. Nothing is logged or stored by this app.
