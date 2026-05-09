# ContentIQ — AI Content Dashboard

A React analytics dashboard with AI-powered insights, interactive charts, and one-click CSV/PDF export. Built with Recharts and the Anthropic Claude API.

---

## Features

- **4-tab navigation** — Overview, Channels, Content, AI Insights
- **Live AI analysis** — Streams real-time insights from Claude (claude-sonnet-4) about your content data
- **Interactive charts** — Area, bar, pie, and line charts via Recharts
- **Traffic channel breakdown** — Donut chart + horizontal bar view of source distribution
- **Top content table** — Ranked articles with engagement progress bars
- **CSV export** — Downloads monthly performance as a spreadsheet
- **PDF export** — Generates a print-ready HTML report with all metrics and tables
- **Dark/light mode** — Automatically follows system preference via CSS variables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (functional components, hooks) |
| Charts | Recharts |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Styling | Inline CSS + CSS variables (no external CSS framework) |
| Export | Native Blob API (CSV), `window.open` + `print()` (PDF) |

---

## Project Structure

```
AIContentDashboard.jsx   # Single-file React component
README.md                # This file
```

The entire dashboard lives in one `.jsx` file, structured as:

```
App                        # Root — nav bar, tab routing, export buttons
├── Stat                   # Metric card (value + % change indicator)
├── AIInsightPanel         # Claude API streaming insight panel
│   ├── Quick-prompt pills
│   ├── Streaming text output
│   └── Custom question input
└── Tab views
    ├── Overview           # Area chart + bar chart + AIInsightPanel
    ├── Channels           # Pie chart + channel breakdown bars
    ├── Content            # Top content table with engagement bars
    └── AI Insights        # Full-screen AIInsightPanel
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# 1. Create a new React app (or add to an existing one)
npx create-react-app contentiq
cd contentiq

# 2. Install dependencies
npm install recharts

# 3. Drop in the component
cp AIContentDashboard.jsx src/App.jsx

# 4. Start the dev server
npm start
```

### API Key Setup

The dashboard calls `https://api.anthropic.com/v1/messages` directly from the browser. In production you should proxy this through your own backend to keep the key secret.

**For local development**, set the key in a `.env` file and proxy requests through a small Express server:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

```js
// server.js (minimal proxy)
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/claude', async (req, res) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),
  });
  response.body.pipe(res);
});

app.listen(3001);
```

Then in `AIInsightPanel`, change the fetch URL from `https://api.anthropic.com/v1/messages` to `/api/claude`.

---

## Connecting Real Data

All mock data lives in the `MOCK_DATA` constant near the top of the file. Replace it with your own API calls:

```js
// Example: fetch from your backend
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/api/analytics?period=year')
    .then(r => r.json())
    .then(setData);
}, []);
```

### Expected data shape

```js
{
  overview: [
    { month: "Jan", views: 12400, engagement: 3200, conversions: 420 },
    // one entry per month/period
  ],
  channels: [
    { name: "Organic Search", value: 38, color: "#e8673a" },
    // value is a percentage (0–100)
  ],
  topContent: [
    { title: "Article title", views: 8420, engagement: 71, category: "AI" },
    // engagement is a percentage (0–100)
  ],
  metrics: {
    totalViews: 274200,
    avgEngagement: 28.4,      // percentage
    totalConversions: 9790,
    bounceRate: 42.1,          // percentage
    viewsChange: 18.2,         // % change vs prior period (positive = up)
    engagementChange: 11.7,
    conversionChange: 24.3,
    bounceChange: -3.8,        // negative = improvement
  }
}
```

---

## AI Insights Panel

The `AIInsightPanel` component sends your full dataset to Claude with each request and streams the response token-by-token using the Anthropic SSE streaming API.

**Built-in quick prompts:**
- "Summarize trends and give 3 actionable recommendations" (default on load)
- "What's driving the Q4 spike?"
- "Which channel should we invest more in?"
- "Predict next quarter's performance."
- "What content type should we create more of?"

**Custom questions** — the free-text input at the bottom lets users ask anything. Press Enter or click Ask.

To change the AI's persona or focus area, edit the `systemPrompt` string inside `AIInsightPanel`:

```js
const systemPrompt = `You are a senior content analytics strategist...`;
```

---

## Export Details

### CSV export

Downloads `content-analytics.csv` with columns: Month, Views, Engagements, Conversions. Covers all months in `data.overview`.

### PDF export

Opens a new tab with a styled HTML report, then triggers `window.print()`. The report includes:
- Summary metric cards
- Monthly performance table
- Traffic channels table
- Top content table

The browser's native print dialog handles paper size and margins. Save as PDF from there.

---

## Customization

| What | Where |
|---|---|
| Accent color | `const ACCENT = "#e8673a"` at top of file |
| Secondary / tertiary colors | `ACCENT2`, `ACCENT3` |
| AI model | `model` field in the fetch body inside `AIInsightPanel` |
| Quick-prompt pills | `quickPrompts` array inside `AIInsightPanel` |
| Nav tabs | `NAV_ITEMS` array near the bottom |
| PDF report branding | The `html` template string inside `exportPDF()` |

---

## Browser Support

Requires a browser with support for:
- `ReadableStream` / `getReader()` — for SSE streaming (all modern browsers)
- `URL.createObjectURL` — for CSV download
- CSS custom properties

Tested on Chrome 120+, Firefox 121+, Safari 17+.

---

## License

MIT — use freely, attribution appreciated.
