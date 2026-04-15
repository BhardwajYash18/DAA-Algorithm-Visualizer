import { useState } from 'react'

const API = 'http://localhost:5000/api'

export default function LCS() {
  const [X,      setX]      = useState('AGGTAB')
  const [Y,      setY]      = useState('GXTXAYB')
  const [result, setResult] = useState(null)
  const [loading,setLoading]= useState(false)
  const [error,  setError]  = useState(null)

  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    try {
      const res = await fetch(`${API}/lcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ X, Y }),
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
      <h1 className="page-title">💬 Longest Common Subsequence (LCS)</h1>
      <p className="page-subtitle">
        <strong className="text-gold">Real-Life Application:</strong> Used in DNA sequence analysis,
        plagiarism detection, and file comparison tools (like Git diff) to find similarities between sequences.
      </p>
      <div className="gold-divider" />

      <div className="alert alert-info" style={{ marginBottom: '1.2rem' }}>
        💡 Example: find the common genetic code between two DNA strands.
      </div>

      <div className="cols-2">
        <div className="form-group">
          <label className="form-label">First String (Sequence 1)</label>
          <input className="form-input" value={X} onChange={e => setX(e.target.value)}
            placeholder="e.g. AGGTAB" />
        </div>
        <div className="form-group">
          <label className="form-label">Second String (Sequence 2)</label>
          <input className="form-input" value={Y} onChange={e => setY(e.target.value)}
            placeholder="e.g. GXTXAYB" />
        </div>
      </div>

      <button className="btn btn-primary" onClick={run} disabled={loading}>
        {loading ? '⏳ Running…' : '▶ Find LCS'}
      </button>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          Filling DP table…
        </div>
      )}

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {result && (
        <>
          <div className="gold-divider" />

          <div className="metric-banner">
            <div className="metric-item">
              <div className="label">LCS Length</div>
              <div className="value">{result.length}</div>
              <div className="unit">characters</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">Longest Common Subsequence</div>
              <div className="value" style={{ fontSize: '1.6rem', letterSpacing: '0.12em' }}>
                {result.sequence || 'None'}
              </div>
            </div>
          </div>

          {result.alignment_chart_b64 && (
            <>
              <div className="section-heading">Alignment Visualisation</div>
              <img className="chart-img"
                src={`data:image/png;base64,${result.alignment_chart_b64}`}
                alt="LCS alignment" />
            </>
          )}

          <div className="section-heading">Dynamic Programming Table</div>
          <div className="alert alert-info" style={{ marginBottom: '0.6rem' }}>
            Rows: Sequence 1 (X) &nbsp;·&nbsp; Columns: Sequence 2 (Y)
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ color: '#555', fontStyle: 'italic' }}>idx</th>
                  {result.col_labels.map((c, i) => <th key={i}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.dp_table.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ color: '#d4a017', fontWeight: 600 }}>{result.row_labels[ri]}</td>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{
                        color: cell > 0 ? '#f0c040' : '#555',
                        fontWeight: cell > 0 ? 600 : 400,
                      }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
