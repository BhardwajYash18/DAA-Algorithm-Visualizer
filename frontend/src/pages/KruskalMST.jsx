import { useState } from 'react'

const API = 'http://localhost:5000/api'

const DEFAULT_EDGES = `0,1,10
0,2,6
0,3,5
1,3,15
2,3,4`

export default function KruskalMST() {
  const [n,         setN]         = useState(4)
  const [edgesText, setEdgesText] = useState(DEFAULT_EDGES)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    try {
      const edges = edgesText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
          const [u, v, w] = l.split(',').map(Number)
          return { u, v, w }
        })

      const res = await fetch(`${API}/kruskal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: Number(n), edges }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
    } catch {
      setError('Could not connect to the backend. Is Flask running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
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
        <>
          <div className="gold-divider" />

          <div className="metric-banner">
            <div className="metric-item">
              <div className="label">Total MST Cost</div>
              <div className="value">{result.cost}</div>
              <div className="unit">weight units</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">MST Edges</div>
              <div className="value" style={{ fontSize: '1rem', lineHeight: 2 }}>
                {result.mst_edges.map((e, i) => (
                  <span key={i} style={{ display: 'inline-block', marginRight: '0.7rem' }}>
                    {e.u}→{e.v} <span style={{ color: '#555' }}>({e.w})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="section-heading">Graph Visualisation</div>
          <div className="chart-grid">
            <div>
              <p className="text-dim text-sm" style={{ marginBottom: '0.4rem' }}>Original Graph</p>
              <img className="chart-img" src={`data:image/png;base64,${result.original_chart_b64}`} alt="Original graph" />
            </div>
            <div>
              <p className="text-dim text-sm" style={{ marginBottom: '0.4rem' }}>Resulting MST</p>
              <img className="chart-img" src={`data:image/png;base64,${result.mst_chart_b64}`} alt="MST graph" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
