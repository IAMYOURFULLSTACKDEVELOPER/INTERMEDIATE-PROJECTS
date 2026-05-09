import { useState, useEffect, useRef, useCallback } from "react";
import logo from "./logo.svg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const ACCENT = "#e8673a";
const ACCENT2 = "#3a8ee8";
const ACCENT3 = "#3ae88a";
const MUTED = "#888";

const MOCK_DATA = {
  overview: [
    { month: "Jan", views: 12400, engagement: 3200, conversions: 420 },
    { month: "Feb", views: 15800, engagement: 4100, conversions: 510 },
    { month: "Mar", views: 13200, engagement: 3800, conversions: 380 },
    { month: "Apr", views: 18900, engagement: 5200, conversions: 640 },
    { month: "May", views: 22100, engagement: 6100, conversions: 790 },
    { month: "Jun", views: 19400, engagement: 5400, conversions: 680 },
    { month: "Jul", views: 25600, engagement: 7200, conversions: 920 },
    { month: "Aug", views: 28100, engagement: 8000, conversions: 1050 },
    { month: "Sep", views: 24300, engagement: 6800, conversions: 870 },
    { month: "Oct", views: 31200, engagement: 9100, conversions: 1180 },
    { month: "Nov", views: 27800, engagement: 7900, conversions: 1010 },
    { month: "Dec", views: 35400, engagement: 10200, conversions: 1340 },
  ],
  channels: [
    { name: "Organic Search", value: 38, color: ACCENT },
    { name: "Social Media", value: 27, color: ACCENT2 },
    { name: "Direct", value: 18, color: ACCENT3 },
    { name: "Email", value: 11, color: "#e8c43a" },
    { name: "Referral", value: 6, color: "#9b3ae8" },
  ],
  topContent: [
    { title: "The Future of AI in Marketing", views: 8420, engagement: 71, category: "AI" },
    { title: "10 Growth Hacks for 2025", views: 7190, engagement: 65, category: "Growth" },
    { title: "Building Scalable Systems", views: 6340, engagement: 58, category: "Tech" },
    { title: "Content Strategy Deep Dive", views: 5820, engagement: 62, category: "Strategy" },
    { title: "Analytics That Actually Matter", views: 5110, engagement: 54, category: "Analytics" },
    { title: "UX Patterns for Conversion", views: 4780, engagement: 49, category: "UX" },
    { title: "Email Marketing Reimagined", views: 4320, engagement: 44, category: "Email" },
  ],
  metrics: {
    totalViews: 274200,
    avgEngagement: 28.4,
    totalConversions: 9790,
    bounceRate: 42.1,
    viewsChange: 18.2,
    engagementChange: 11.7,
    conversionChange: 24.3,
    bounceChange: -3.8,
  },
};

function Stat({ label, value, change, prefix = "", suffix = "" }) {
  const up = change > 0;
  return (
    <div style={{
      background: "var(--bg2)",
      borderRadius: 12,
      padding: "18px 20px",
      border: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <span style={{ fontSize: 12, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "var(--fg)" }}>
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </span>
      <span style={{ fontSize: 12, color: up ? "#3ae88a" : "#e83a3a", fontWeight: 600 }}>
        {up ? "▲" : "▼"} {Math.abs(change)}% vs last period
      </span>
    </div>
  );
}

function AIInsightPanel({ data }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("Summarize trends and give 3 actionable recommendations.");
  const abortRef = useRef(null);

  const fetchInsight = useCallback(async (customPrompt) => {
    setLoading(true);
    setInsight("");
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const systemPrompt = `You are a senior content analytics strategist. You analyze content performance data and provide sharp, concrete insights. Be concise but impactful. Use data points. Format with short paragraphs and bullet points where helpful. No fluff.`;

    const userMessage = `Here is the content analytics data for a digital media brand:

Monthly performance (Jan–Dec):
${data.overview.map(d => `${d.month}: ${d.views.toLocaleString()} views, ${d.engagement.toLocaleString()} engagements, ${d.conversions} conversions`).join("\n")}

Traffic channels: ${data.channels.map(c => `${c.name} ${c.value}%`).join(", ")}

Top content: ${data.topContent.map(c => `"${c.title}" — ${c.views.toLocaleString()} views, ${c.engagement}% engagement`).join("; ")}

Key metrics: ${data.metrics.totalViews.toLocaleString()} total views (+${data.metrics.viewsChange}%), ${data.metrics.avgEngagement}% avg engagement (+${data.metrics.engagementChange}%), ${data.metrics.totalConversions.toLocaleString()} conversions (+${data.metrics.conversionChange}%), ${data.metrics.bounceRate}% bounce rate (${data.metrics.bounceChange}%)

${customPrompt}`;

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      setInsight("Please set your REACT_APP_GEMINI_API_KEY in the .env file.");
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContentStream(userMessage);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        setInsight(prev => prev + chunkText);
      }
    } catch (e) {
      console.error("Gemini Error:", e);
      setInsight("Failed to load insights. Check your API key and network connection.");
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => { fetchInsight(prompt); }, []);

  const quickPrompts = [
    "What's driving the Q4 spike?",
    "Which channel should we invest more in?",
    "Predict next quarter's performance.",
    "What content type should we create more of?",
  ];

  return (
    <div style={{
      background: "var(--bg2)",
      borderRadius: 12,
      border: "1px solid var(--border)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${ACCENT}22`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--fg)" }}>AI Insights</span>
        <span style={{
          marginLeft: "auto", fontSize: 11, background: `${ACCENT}22`,
          color: ACCENT, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
        }}>LIVE</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {quickPrompts.map(q => (
          <button
            key={q}
            onClick={() => { setPrompt(q); fetchInsight(q); }}
            style={{
              fontSize: 12, padding: "4px 12px", borderRadius: 99,
              border: `1px solid ${prompt === q ? ACCENT : "var(--border)"}`,
              background: prompt === q ? `${ACCENT}18` : "transparent",
              color: prompt === q ? ACCENT : MUTED,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <div style={{
        minHeight: 160,
        fontSize: 14,
        lineHeight: 1.75,
        color: "var(--fg)",
        position: "relative",
        whiteSpace: "pre-wrap",
      }}>
        {loading && !insight && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", color: MUTED }}>
            <span className="pulse-dot" />
            <span className="pulse-dot" style={{ animationDelay: "0.15s" }} />
            <span className="pulse-dot" style={{ animationDelay: "0.3s" }} />
            <span style={{ fontSize: 12, marginLeft: 4 }}>Analyzing your data…</span>
          </div>
        )}
        {insight}
        {loading && insight && <span className="blink-cursor">▌</span>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !loading && fetchInsight(prompt)}
          placeholder="Ask a custom question about your data…"
          style={{
            flex: 1, fontSize: 13, padding: "8px 12px",
            borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg1)", color: "var(--fg)", fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          onClick={() => fetchInsight(prompt)}
          disabled={loading}
          style={{
            padding: "8px 16px", borderRadius: 8,
            background: loading ? MUTED : ACCENT,
            border: "none", color: "#fff", fontWeight: 600,
            fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background 0.2s",
          }}
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
}

function exportCSV(data) {
  const rows = [
    ["Month", "Views", "Engagements", "Conversions"],
    ...data.overview.map(d => [d.month, d.views, d.engagement, d.conversions]),
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "content-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(data) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Content Analytics Report</title>
  <style>
    body { font-family: system-ui; margin: 40px; color: #111; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 18px; font-weight: 600; margin: 32px 0 12px; color: #333; border-bottom: 2px solid #e8673a; padding-bottom: 6px; }
    .meta { color: #888; font-size: 13px; margin-bottom: 32px; }
    .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: #f9f9f9; border-radius: 10px; padding: 16px; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; font-weight: 600; }
    .stat-value { font-size: 26px; font-weight: 700; margin: 6px 0; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #f3f3f3; font-weight: 600; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; }
    tr:hover td { background: #fafafa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; background: #e8673a22; color: #e8673a; }
    footer { margin-top: 48px; font-size: 11px; color: #ccc; }
  </style>
</head>
<body>
  <h1>Content Analytics Report</h1>
  <p class="meta">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Full Year Overview</p>

  <div class="stats">
    <div class="stat"><div class="stat-label">Total Views</div><div class="stat-value">${data.metrics.totalViews.toLocaleString()}</div><div style="color:#3ae88a;font-size:12px;font-weight:600">▲ ${data.metrics.viewsChange}%</div></div>
    <div class="stat"><div class="stat-label">Avg Engagement</div><div class="stat-value">${data.metrics.avgEngagement}%</div><div style="color:#3ae88a;font-size:12px;font-weight:600">▲ ${data.metrics.engagementChange}%</div></div>
    <div class="stat"><div class="stat-label">Conversions</div><div class="stat-value">${data.metrics.totalConversions.toLocaleString()}</div><div style="color:#3ae88a;font-size:12px;font-weight:600">▲ ${data.metrics.conversionChange}%</div></div>
    <div class="stat"><div class="stat-label">Bounce Rate</div><div class="stat-value">${data.metrics.bounceRate}%</div><div style="color:#3ae88a;font-size:12px;font-weight:600">▼ ${Math.abs(data.metrics.bounceChange)}%</div></div>
  </div>

  <h2>Monthly Performance</h2>
  <table>
    <thead><tr><th>Month</th><th>Views</th><th>Engagements</th><th>Conversions</th></tr></thead>
    <tbody>${data.overview.map(d => `<tr><td>${d.month}</td><td>${d.views.toLocaleString()}</td><td>${d.engagement.toLocaleString()}</td><td>${d.conversions}</td></tr>`).join("")}</tbody>
  </table>

  <h2>Traffic Channels</h2>
  <table>
    <thead><tr><th>Channel</th><th>Share</th></tr></thead>
    <tbody>${data.channels.map(c => `<tr><td>${c.name}</td><td>${c.value}%</td></tr>`).join("")}</tbody>
  </table>

  <h2>Top Content</h2>
  <table>
    <thead><tr><th>Title</th><th>Views</th><th>Engagement</th><th>Category</th></tr></thead>
    <tbody>${data.topContent.map(c => `<tr><td>${c.title}</td><td>${c.views.toLocaleString()}</td><td>${c.engagement}%</td><td><span class="badge">${c.category}</span></td></tr>`).join("")}</tbody>
  </table>

  <footer>AI Content Dashboard · Generated by Claude</footer>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => { win.print(); URL.revokeObjectURL(url); };
  }
}

const NAV_ITEMS = ["Overview", "Channels", "Content", "AI Insights"];

export default function AIContentDashboard() {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState(MOCK_DATA);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const dataUrl = process.env.REACT_APP_ANALYTICS_API_URL;
    if (dataUrl && dataUrl !== "YOUR_ANALYTICS_API_URL_HERE") {
      setDataLoading(true);
      fetch(dataUrl)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setDataLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch real data:", err);
          setDataLoading(false);
        });
    }
  }, []);

  return (
    <>
      <style>{`
        :root {
          --bg1: #0f0f11;
          --bg2: #17171a;
          --border: rgba(255,255,255,0.08);
          --fg: #f0f0f0;
        }
        @media (prefers-color-scheme: light) {
          :root {
            --bg1: #f5f5f7;
            --bg2: #ffffff;
            --border: rgba(0,0,0,0.1);
            --fg: #111;
          }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg1); }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${ACCENT}; display: inline-block;
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        .blink-cursor { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .tab-btn { border: none; background: none; cursor: pointer; font-family: inherit; }
        .tab-btn:hover { opacity: 0.8; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg1)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Top bar */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          height: 56,
          gap: 32,
          background: "var(--bg2)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="AI Content Dashboard Logo" style={{ height: 32 }} />
          </div>

          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {NAV_ITEMS.map(n => (
              <button
                key={n}
                className="tab-btn"
                onClick={() => setTab(n)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: tab === n ? ACCENT : MUTED,
                  background: tab === n ? `${ACCENT}15` : "transparent",
                  transition: "all 0.15s",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => exportCSV(data)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600,
                padding: "6px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--fg)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              CSV
            </button>
            <button
              onClick={() => exportPDF(data)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600,
                padding: "6px 12px", borderRadius: 8,
                border: "none", background: ACCENT,
                color: "#fff", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <Stat label="Total Views" value={data.metrics.totalViews} change={data.metrics.viewsChange} />
            <Stat label="Avg Engagement" value={data.metrics.avgEngagement} change={data.metrics.engagementChange} suffix="%" />
            <Stat label="Conversions" value={data.metrics.totalConversions} change={data.metrics.conversionChange} />
            <Stat label="Bounce Rate" value={data.metrics.bounceRate} change={data.metrics.bounceChange} suffix="%" />
          </div>

          {/* Main content area by tab */}
          {(tab === "Overview" || tab === "Channels") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
              {tab === "Overview" && (
                <>
                  <div style={{ background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--fg)", marginBottom: 20 }}>Traffic Over Time</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data.overview} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gEngage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ACCENT2} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ACCENT2} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <Tooltip
                          contentStyle={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: "var(--fg)", fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="views" stroke={ACCENT} strokeWidth={2} fill="url(#gViews)" name="Views" />
                        <Area type="monotone" dataKey="engagement" stroke={ACCENT2} strokeWidth={2} fill="url(#gEngage)" name="Engagements" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--fg)", marginBottom: 20 }}>Conversions</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.overview} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip contentStyle={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "var(--fg)", fontWeight: 600 }} />
                        <Bar dataKey="conversions" fill={ACCENT3} radius={[4, 4, 0, 0]} name="Conversions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {tab === "Channels" && (
                <>
                  <div style={{ background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--fg)", marginBottom: 20 }}>Channel Distribution</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={data.channels} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" stroke="none">
                          {data.channels.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8 }}>
                      {data.channels.map(c => (
                        <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg)" }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                          {c.name} — {c.value}%
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--fg)", marginBottom: 16 }}>By Channel</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {data.channels.map(c => (
                        <div key={c.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                            <span style={{ color: "var(--fg)" }}>{c.name}</span>
                            <span style={{ color: c.color, fontWeight: 700 }}>{c.value}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                            <div style={{ width: `${c.value}%`, height: "100%", background: c.color, borderRadius: 99 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "Content" && (
            <div style={{ background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--fg)" }}>Top Performing Content</p>
                <span style={{ fontSize: 12, color: MUTED }}>{data.topContent.length} articles</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Title", "Category", "Views", "Engagement"].map(h => (
                      <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topContent.map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{c.title}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                          background: `${ACCENT}18`, color: ACCENT,
                        }}>{c.category}</span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "var(--fg)", fontFamily: "monospace" }}>{c.views.toLocaleString()}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden", minWidth: 80 }}>
                            <div style={{ width: `${c.engagement}%`, height: "100%", background: ACCENT2, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, color: "var(--fg)", fontFamily: "monospace", minWidth: 36 }}>{c.engagement}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* AI Insights tab */}
          {tab === "AI Insights" && <AIInsightPanel data={data} />}

          {/* Always show AI panel on Overview */}
          {tab === "Overview" && <AIInsightPanel data={data} />}
        </div>
      </div>
    </>
  );
}
