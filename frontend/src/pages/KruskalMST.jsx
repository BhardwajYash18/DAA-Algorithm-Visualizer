import { useState, useEffect, useRef } from 'react'

const API = 'https://daa-algorithm-visualizer.onrender.com/api'

const DEFAULT_EDGES = `0,1,10
0,2,6
0,3,5
1,3,15
2,3,4`

/* Build Kruskal step list on the frontend from all edges + accepted MST edges */
function buildKruskalSteps(allEdges, mstEdges) {
  const sorted = [...allEdges].sort((a, b) => a.w - b.w)
  const mstSet = new Set(mstEdges.map(e => `${e.u}-${e.v}`))
  let running = 0
  return sorted.map((e, i) => {
    const key = `${e.u}-${e.v}`
    const revKey = `${e.v}-${e.u}`
    const accepted = mstSet.has(key) || mstSet.has(revKey)
    if (accepted) running += e.w
    return { idx: i + 1, u: e.u, v: e.v, w: e.w, accepted, running }
  })
}

export default function KruskalMST() {
  const [n,         setN]         = useState(4)
  const [edgesText, setEdgesText] = useState(DEFAULT_EDGES)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  // Step playback
  const [steps,      setSteps]      = useState([])
  const [activeStep, setActiveStep] = useState(-1)
  const [playing,    setPlaying]    = useState(false)
  const intervalRef = useRef(null)

  const parseEdges = () =>
    edgesText.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [u, v, w] = l.split(',').map(Number)
      return { u, v, w }
    })

  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    setSteps([]); setActiveStep(-1); setPlaying(false)
    clearInterval(intervalRef.current)
    try {
      const edges = parseEdges()
      const res = await fetch(`${API}/kruskal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: Number(n), edges }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
      const built = buildKruskalSteps(edges, data.mst_edges)
      setSteps(built)
      setActiveStep(0)
    } catch {
      setError('Could not connect to the backend. Is Flask running?')
    } finally {
      setLoading(false)
    }
  }

  /* auto-play */
  useEffect(() => {
    if (!playing || steps.length === 0) return
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= steps.length - 1) { setPlaying(false); return prev }
        return prev + 1
      })
    }, 600)
    return () => clearInterval(intervalRef.current)
  }, [playing, steps])

  const stepClass = (i) => {
    if (i < activeStep) return 'step-row step-done'
    if (i === activeStep) return 'step-row step-active'
    return 'step-row step-future'
  }

  return (
    <div className="page-enter">
      <h1 className="page-title">🌉 Minimum Spanning Tree — Kruskal's Algorithm</h1>
      <p className="page-subtitle">
        <strong className="text-gold">Real-Life Application:</strong> Used in network design
        (telecom, electrical grids, roads) to connect all points with the minimum total cost.
      </p>
      <div className="gold-divider" />

      <div className="form-group">
        <label className="form-label">Number of Vertices (Nodes)</label>
        <input className="form-input" style={{ width: 120 }} type="number" min={2} max={20}
          value={n} onChange={e => setN(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Edges — one per line: node1,node2,weight</label>
        <textarea className="form-textarea" value={edgesText}
          onChange={e => setEdgesText(e.target.value)}
          rows={7}
          spellCheck={false}
          style={{ fontFamily: 'monospace', fontSize: '0.88rem' }} />
      </div>

      <button className="btn btn-primary" onClick={run} disabled={loading}>
        {loading ? '⏳ Running…' : '▶ Run Kruskal MST'}
      </button>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          Building spanning tree…
        </div>
      )}

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {result && (
        <div className="result-enter">
          <div className="gold-divider" />

          <div className="metric-banner anim-fade-in-up">
            <div className="metric-item">
              <div className="label">Total MST Cost</div>
              <div className="value anim-count-up">{result.cost}</div>
              <div className="unit">weight units</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">MST Edges</div>
              <div className="value" style={{ fontSize: '1rem', lineHeight: 2 }}>
                {result.mst_edges.map((e, i) => (
                  <span key={i} style={{ display: 'inline-block', marginRight: '0.7rem',
                    animation: `rowIn 0.3s ease ${i * 0.08}s both` }}>
                    {e.u}→{e.v} <span style={{ color: '#555' }}>({e.w})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Step panel */}
          <div className="section-heading" style={{ marginTop: '1.4rem' }}>
            Edge Processing — Step by Step
          </div>
          <div className="alert alert-info" style={{ marginBottom: '0.6rem', fontSize: '0.82rem' }}>
            💡 Edges are sorted by weight. Each edge is either <strong>accepted</strong> (no cycle) or <strong>rejected</strong> (would form a cycle — Union-Find check).
          </div>

          <div className="playback-bar">
            <button className="btn-xs" onClick={() => setActiveStep(0)}>⏮ Reset</button>
            <button
              className={`btn-xs${playing ? ' active' : ''}`}
              onClick={() => {
                if (activeStep >= steps.length - 1) setActiveStep(0)
                setPlaying(p => !p)
              }}
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button className="btn-xs" onClick={() => setActiveStep(p => Math.min(steps.length - 1, p + 1))}>Step ▶</button>
            <span className="step-counter">Step {activeStep + 1} / {steps.length}</span>
          </div>

          <div className="steps-panel">
            <div className="steps-panel-header">
              <span className="sp-title">🔗 Kruskal Edge Decisions</span>
              <span className="sp-badge">Greedy · Sort by Weight</span>
            </div>
            <div className="steps-panel-body">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={stepClass(i)}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="step-num">{i < activeStep ? (steps[i].accepted ? '✓' : '✗') : i + 1}</div>
                  <div className="step-body">
                    <strong>Edge {s.u}→{s.v}</strong>
                    {' '}(weight: <strong>{s.w}</strong>)
                    <br />
                    <span className="step-formula">
                      {s.accepted
                        ? `MST cost so far: ${s.running}`
                        : 'Union-Find: same component → skip'}
                    </span>
                  </div>
                  {i <= activeStep
                    ? <span className={s.accepted ? 'badge-accept' : 'badge-reject'}>
                        {s.accepted ? '✓ Accept' : '✗ Reject'}
                      </span>
                    : <span style={{ color: '#333', fontSize: '0.72rem' }}>pending</span>
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="section-heading">Graph Visualisation</div>
          <div className="chart-grid anim-fade-in">
            <div>
              <p className="text-dim text-sm" style={{ marginBottom: '0.4rem' }}>Original Graph</p>
              <img className="chart-img" src={`data:image/png;base64,${result.original_chart_b64}`} alt="Original graph" />
            </div>
            <div>
              <p className="text-dim text-sm" style={{ marginBottom: '0.4rem' }}>Resulting MST</p>
              <img className="chart-img" src={`data:image/png;base64,${result.mst_chart_b64}`} alt="MST graph" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
