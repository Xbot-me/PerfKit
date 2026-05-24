import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ScoreGauge from "../components/ScoreGauge.jsx";
import WebVitals from "../components/WebVitals.jsx";
import WaterfallChart from "../components/WaterfallChart.jsx";
import Filmstrip from "../components/Filmstrip.jsx";
import AuditList from "../components/AuditList.jsx";

const TABS = [
  "Overview",
  "Vitals",
  "Waterfall",
  "Filmstrip",
  "Audits",
  "Screenshot",
  "AI Analysis"
];

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text3)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "var(--mono)",
          color: "var(--text)",
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text3)" }}>{sub}</div>}
    </div>
  );
}

function formatBytes(b) {
  if (b == null) return "—";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(2) + " MB";
}

function formatMs(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return Math.round(ms) + "ms";
  return (ms / 1000).toFixed(2) + "s";
}

export default function Report() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("Overview");
  const pollRef = useRef(null);

  useEffect(() => {
    async function fetchRun() {
      try {
        const { data } = await axios.get(`/api/runs/${id}`);
        setRun(data);
        setStatus(data.status);
        if (data.status === "pending") {
          pollRef.current = setTimeout(fetchRun, 2500);
        }
      } catch (e) {
        setStatus("error");
      }
    }
    fetchRun();
    return () => clearTimeout(pollRef.current);
  }, [id]);

  if (
    status === "loading" ||
    (status === "pending" && !run) ||
    status === "pending"
  ) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          gap: 24,
        }}
      >
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        `}</style>
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid var(--border)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--accent)",
              animation: "spin 0.9s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--accent)",
              opacity: 0.4,
              animation: "spin 1.4s linear infinite reverse",
            }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Analyzing
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              >
                .
              </span>
            ))}
          </div>
          {run?.url && (
            <div
              style={{
                fontSize: 13,
                color: "var(--accent)",
                fontFamily: "var(--mono)",
                marginBottom: 6,
              }}
            >
              {run.url}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.7 }}>
            Running Lighthouse audit · Capturing screenshots
            <br />
            <span
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
                display: "inline-block",
              }}
            >
              Usually takes 20–40 seconds
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["Performance", "Accessibility", "Best Practices", "SEO"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 11,
                  color: "var(--text3)",
                  letterSpacing: "0.04em",
                  animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8,
            color: "var(--poor)",
          }}
        >
          Analysis Failed
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text3)",
            marginBottom: 24,
            fontFamily: "var(--mono)",
          }}
        >
          {run?.error || "Unknown error occurred"}
        </div>
        <Link
          to="/"
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "#0a0a0f",
            padding: "10px 24px",
            borderRadius: "var(--radius)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Try Again
        </Link>
      </div>
    );
  }

  if (!run) return null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link
          to="/"
          style={{
            fontSize: 12,
            color: "var(--text3)",
            fontFamily: "var(--mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
          }}
        >
          ← Back
        </Link>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: 4,
                color: "var(--text)",
              }}
            >
              {run.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </h1>
            <div
              style={{
                fontSize: 12,
                color: "var(--text3)",
                fontFamily: "var(--mono)",
              }}
            >
              {new Date(run.created_at).toLocaleString()} · {run.url}
            </div>
          </div>
          <a
            href={run.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "7px 14px",
              fontSize: 12,
              color: "var(--text2)",
              fontFamily: "var(--mono)",
            }}
          >
            Open site ↗
          </a>
        </div>
      </div>

      {/* Score gauges */}
      <div
        style={{
          background: "var(--bg3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: 24,
          marginBottom: 20,
        }}
      >
        {[
          { score: run.score_performance, label: "Performance" },
          { score: run.score_accessibility, label: "Accessibility" },
          { score: run.score_best_practices, label: "Best Practices" },
          { score: run.score_seo, label: "SEO" },
        ].map(({ score, label }) => (
          <ScoreGauge key={label} score={score} label={label} size={100} />
        ))}
      </div>

      {/* Quick stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <StatCard label="Requests" value={run.total_requests ?? "—"} />
        <StatCard label="Total Size" value={formatBytes(run.total_bytes)} />
        <StatCard
          label="DOM Size"
          value={run.dom_size ? run.dom_size.toLocaleString() : "—"}
          sub="nodes"
        />
        <StatCard label="Load Time" value={formatMs(run.fully_loaded_ms)} />
      </div>

      {/* Resource breakdown bar */}
      {run.har &&
        run.har.length > 0 &&
        (() => {
          const byType = {};
          run.har.forEach((e) => {
            byType[e.type] = (byType[e.type] || 0) + (e.transferSize || 0);
          });
          const total = Object.values(byType).reduce((a, b) => a + b, 0);
          const TYPE_COLORS = {
            document: "#4d9eff",
            stylesheet: "#a78bfa",
            script: "#f5a623",
            image: "#00e5a0",
            font: "#f472b6",
            xhr: "#fb7185",
            other: "#5a5a70",
          };
          const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
          return (
            <div
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "14px 16px",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Page Weight by Type
              </div>
              <div
                style={{
                  display: "flex",
                  height: 20,
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                {entries.map(([type, bytes]) => (
                  <div
                    key={type}
                    title={`${type}: ${formatBytes(bytes)}`}
                    style={{
                      width: `${(bytes / total) * 100}%`,
                      background: TYPE_COLORS[type] || "#5a5a70",
                      minWidth: bytes > 0 ? 2 : 0,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {entries.map(([type, bytes]) => (
                  <div
                    key={type}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: TYPE_COLORS[type] || "#5a5a70",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {type}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--mono)",
                        color: "var(--text2)",
                      }}
                    >
                      {formatBytes(bytes)}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>
                      ({Math.round((bytes / total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* Tabs */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
          display: "flex",
          gap: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              color: tab === t ? "var(--accent)" : "var(--text3)",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              fontFamily: "var(--font)",
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <section>
              <SectionTitle>Core Web Vitals</SectionTitle>
              <WebVitals run={run} />
            </section>
            {run.audits?.length > 0 && (
              <section>
                <SectionTitle>Top Issues</SectionTitle>
                <AuditList audits={run.audits?.slice(0, 5)} />
              </section>
            )}
          </div>
        )}

        {tab === "Vitals" && (
          <div>
            <SectionTitle>Core Web Vitals — Detailed</SectionTitle>
            <WebVitals run={run} />
            <div
              style={{
                marginTop: 24,
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 20px",
              }}
            >
              <div
                style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.8 }}
              >
                <p>
                  <span
                    style={{ color: "var(--good)", fontFamily: "var(--mono)" }}
                  >
                    ● Good
                  </span>{" "}
                  — meets recommended thresholds. Great user experience.
                </p>
                <p>
                  <span
                    style={{ color: "var(--warn)", fontFamily: "var(--mono)" }}
                  >
                    ● Needs Improvement
                  </span>{" "}
                  — some users may have a poor experience.
                </p>
                <p>
                  <span
                    style={{ color: "var(--poor)", fontFamily: "var(--mono)" }}
                  >
                    ● Poor
                  </span>{" "}
                  — most users are likely having a poor experience. Fix
                  urgently.
                </p>
                <p
                  style={{ marginTop: 12, fontSize: 11, color: "var(--text3)" }}
                >
                  Note: INP and FID are field metrics (real user data). Lab
                  testing only captures LCP, CLS, FCP, TTFB, TBT, Speed Index.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "Waterfall" && (
          <div>
            <SectionTitle>Network Waterfall</SectionTitle>
            <WaterfallChart entries={run.har} />
          </div>
        )}

        {tab === "Filmstrip" && (
          <div>
            <SectionTitle>Page Load Filmstrip</SectionTitle>
            <Filmstrip frames={run.filmstrip} />
          </div>
        )}

        {tab === "Audits" && (
          <div>
            <SectionTitle>All Audit Recommendations</SectionTitle>
            <AuditList audits={run.audits} />
          </div>
        )}

        {tab === "Screenshot" && (
          <div>
            <SectionTitle>Final Page Screenshot</SectionTitle>
            {run.screenshot_path ? (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  maxWidth: 900,
                }}
              >
                <img
                  src={`/screenshots/${run.screenshot_path}`}
                  alt="Page screenshot"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  color: "var(--text3)",
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                }}
              >
                Screenshot not available
              </div>
            )}
          </div>
        )}

        {tab === 'AI Analysis' && (
          <AIAnalysis run={run} />
        )}
      </div>
    </div>
  );
}

function AIAnalysis({ run }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

 async function generate() {
  setLoading(true)
  setError(null)

  const audits = (run.audits || []).slice(0, 15).map(a => ({
    title: a.title,
    score: a.score,
    displayValue: a.displayValue,
    category: a.category,
  }))

  const prompt = `You are a web performance expert. Analyze this Lighthouse report and give a clear, actionable summary.

URL: ${run.url}

SCORES:
- Performance: ${run.score_performance}/100
- Accessibility: ${run.score_accessibility}/100
- Best Practices: ${run.score_best_practices}/100
- SEO: ${run.score_seo}/100

CORE WEB VITALS:
- LCP: ${run.lcp_value ? (run.lcp_value/1000).toFixed(2)+'s' : '—'} (${run.lcp_rating})
- FCP: ${run.fcp_value ? (run.fcp_value/1000).toFixed(2)+'s' : '—'} (${run.fcp_rating})
- TBT: ${run.tbt_value ? Math.round(run.tbt_value)+'ms' : '—'} (${run.tbt_rating})
- CLS: ${run.cls_value ?? '—'} (${run.cls_rating})
- TTFB: ${run.ttfb_value ? Math.round(run.ttfb_value)+'ms' : '—'} (${run.ttfb_rating})
- Speed Index: ${run.speed_index_value ? (run.speed_index_value/1000).toFixed(2)+'s' : '—'} (${run.speed_index_rating})

PAGE STATS:
- Total requests: ${run.total_requests}
- Total size: ${run.total_bytes ? (run.total_bytes/1024/1024).toFixed(2)+'MB' : '—'}
- DOM size: ${run.dom_size} nodes
- Load time: ${run.fully_loaded_ms ? (run.fully_loaded_ms/1000).toFixed(2)+'s' : '—'}

TOP FAILING AUDITS:
${audits.map(a => `- [${Math.round((a.score||0)*100)}] ${a.title}${a.displayValue ? ' — '+a.displayValue : ''} (${a.category})`).join('\n')}

Please provide:

1. **Overall Assessment** (2-3 sentences summarizing the site's performance health)

2. **Critical Issues to Fix First** (the highest-impact problems, with specific actionable steps for each)

3. **Quick Wins** (easy fixes that can be done immediately)

4. **Core Web Vitals Analysis** (explain each failing/warning metric in plain English and how to improve it)

5. **Priority Action Plan** (numbered list of what to fix in order of impact)

Only mention issues that are actually present in the data provided. Do not invent or assume issues.

Be specific and practical, reference the actual numbers from the report.
Format with clear headers using **bold**.
Write in plain English that a non-technical business owner can understand.
Avoid jargon — if you must use a technical term, explain it in simple words in parentheses.
Use analogies where helpful. Focus on business impact (faster site = more sales, better rankings).
Keep each point concise and scannable.`

  try {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  }),
})
const data = await response.json()
const text = data.choices?.[0]?.message?.content
if (!text) throw new Error(data.error?.message || 'No response from AI')
setAnalysis(text)
  } catch (e) {
    setError(e.message)
  }
  setLoading(false)
}

  function renderMarkdown(text) {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', margin: '20px 0 8px', letterSpacing: '-0.01em' }}>{line.slice(3)}</h3>
        if (line.startsWith('# '))  return <h2 key={i} style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '20px 0 8px' }}>{line.slice(2)}</h2>
        if (line.match(/^\d+\./))   return <p  key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: '4px 0', paddingLeft: 8 }}>{renderInline(line)}</p>
        if (line.startsWith('- '))  return <p  key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: '3px 0', paddingLeft: 8 }}>• {renderInline(line.slice(2))}</p>
        if (line.trim() === '')     return <div key={i} style={{ height: 6 }} />
        return <p key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, margin: '3px 0' }}>{renderInline(line)}</p>
      })
  }

  function renderInline(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
        : part
    )
  }

  return (
    <div>
      <SectionTitle>AI Performance Analysis</SectionTitle>

      {!analysis && !loading && (
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
            AI-Powered Analysis
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
            Get a detailed expert analysis of your results with specific, prioritized recommendations on exactly what to fix and how.
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '🔴', label: 'Critical issues', sub: 'What\'s hurting you most' },
              { icon: '⚡', label: 'Quick wins', sub: 'Easy fixes right now' },
              { icon: '📋', label: 'Priority plan', sub: 'What to fix in order' },
            ].map(f => (
              <div key={f.label} style={{
                background: 'var(--bg4)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 16px', textAlign: 'left', minWidth: 140,
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.sub}</div>
              </div>
            ))}
          </div>
          <button onClick={generate} style={{
            background: 'var(--accent)', color: '#0a0a0f',
            border: 'none', borderRadius: 8,
            padding: '12px 32px', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font)',
            letterSpacing: '0.02em',
          }}>
            Generate AI Analysis →
          </button>
        </div>
      )}

      {loading && (
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '48px 32px', textAlign: 'center',
        }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Analyzing your results...</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Groq is reviewing your Lighthouse data</div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'var(--poor-bg)', border: '1px solid var(--poor)44',
          borderRadius: 8, padding: '16px', marginBottom: 16,
          fontSize: 13, color: 'var(--poor)', fontFamily: 'var(--mono)',
        }}>
          ⚠ {error} — Check your Groq APi key is valid and has quota remaining
        </div>
      )}

      {analysis && (
        <div>
          <div style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '24px 28px', marginBottom: 16,
          }}>
            {renderMarkdown(analysis)}
          </div>
          <button onClick={() => { setAnalysis(null); setError(null) }} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 6, padding: '7px 16px',
            fontSize: 12, color: 'var(--text3)', cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}>
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text3)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}
