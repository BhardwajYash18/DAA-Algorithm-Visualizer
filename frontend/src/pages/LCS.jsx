import { useState, useEffect, useRef } from 'react'

const API = 'https://daa-algorithm-visualizer.onrender.com/api'

/* Build DP step log from dp_table */
function buildLCSSteps(X, Y, dpTable, xIndices, yIndices) {
  const steps = []
  const pathCells = new Set()
  for (let k = 0; k < xIndices.length; k++) {
    pathCells.add(`${xIndices[k]+1},${yIndices[k]+1}`)
  }

  // Show every cell that produced a non-zero value (capped at 40 for UI)
  for (let i = 1; i < dpTable.length; i++) {
    for (let j = 1; j < dpTable[i].length; j++) {
      const val = dpTable[i][j]
      const match = X[i - 1] === Y[j - 1]
      if (match || val > 0) {
        steps.push({
          idx: steps.length + 1,
          xi: i, yj: j,
          charX: X[i - 1], charY: Y[j - 1],
          match,
          val,
          formula: match
            ? `dp[${i}][${j}] = dp[${i-1}][${j-1}] + 1 = ${val}`
            : `dp[${i}][${j}] = max(dp[${i-1}][${j}], dp[${i}][${j-1}]) = ${val}`,
          inPath: pathCells.has(`${i},${j}`),
        })
        if (steps.length >= 40) return steps
      }
    }
  }
  return steps
}

export default function LCS() {
  const [X,      setX]      = useState('AGGTAB')
  const [Y,      setY]      = useState('GXTXAYB')
  const [result, setResult] = useState(null)
  const [loading,setLoading]= useState(false)
  const [error,  setError]  = useState(null)

  // Step playback
  const [steps,       setSteps]       = useState([])
  const [activeStep,  setActiveStep]  = useState(-1)
  const [playing,     setPlaying]     = useState(false)
  const intervalRef = useRef(null)
  // Highlight cell set for DP table
  const [highlightCells, setHighlightCells] = useState(new Set())

  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    setSteps([]); setActiveStep(-1); setPlaying(false)
    setHighlightCells(new Set())
    clearInterval(intervalRef.current)
    try {
      const res = await fetch(`${API}/lcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ X, Y }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
      const built = buildLCSSteps(X, Y, data.dp_table, data.x_indices, data.y_indices)
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
    }, 450)
    return () => clearInterval(intervalRef.current)
  }, [playing, steps])

  /* sync highlighted cell to active step */
  useEffect(() => {
    if (activeStep < 0 || steps.length === 0) return
    const s = steps[activeStep]
    setHighlightCells(new Set([`${s.xi},${s.yj}`]))
  }, [activeStep, steps])

  /* Build path cell set from result */
  const pathCells = result
    ? new Set(result.x_indices.map((xi, k) => `${xi+1},${result.y_indices[k]+1}`))
    : new Set()

  const cellClass = (ri, ci) => {
    const key = `${ri},${ci}`
    if (highlightCells.has(key)) return 'dp-cell dp-highlight'
    if (pathCells.has(key))      return 'dp-cell dp-path'
    return 'dp-cell'
  }

  const stepClass = (i) => {
    if (i < activeStep) return 'step-row step-done'
    if (i === activeStep) return 'step-row step-active'
    return 'step-row step-future'
  }

  return (
    <div className="page-enter">
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
        <div className="result-enter">
          <div className="gold-divider" />

          <div className="metric-banner anim-fade-in-up">
            <div className="metric-item">
              <div className="label">LCS Length</div>
              <div className="value anim-count-up">{result.length}</div>
              <div className="unit">characters</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">Longest Common Subsequence</div>
              <div className="value anim-count-up anim-delay-2"
                style={{ fontSize: '1.6rem', letterSpacing: '0.12em' }}>
                {result.sequence || 'None'}
              </div>
            </div>
          </div>

          {result.alignment_chart_b64 && (
            <>
              <div className="section-heading">Alignment Visualisation</div>
              <img className="chart-img anim-fade-in"
                src={`data:image/png;base64,${result.alignment_chart_b64}`}
                alt="LCS alignment" />
            </>
          )}

          {/* DP Step panel */}
          <div className="section-heading" style={{ marginTop: '1.4rem' }}>
            DP Recurrence — Step by Step
          </div>
          <div className="alert alert-info" style={{ marginBottom: '0.6rem', fontSize: '0.82rem' }}>
            💡 Watch the DP table fill in. <strong style={{ color: '#d4a017' }}>Gold cells</strong> = backtrack path (LCS characters).
            Active cell is highlighted as you step through.
          </div>

          <div className="playback-bar">
            <button className="btn-xs" onClick={() => { setActiveStep(0); setHighlightCells(new Set()) }}>⏮ Reset</button>
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
              <span className="sp-title">🧬 DP Cell Fills</span>
              <span className="sp-badge">Dynamic Programming · O(mn)</span>
            </div>
            <div className="steps-panel-body">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={stepClass(i)}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="step-num">{i < activeStep ? '✓' : i + 1}</div>
                  <div className="step-body">
                    Compare <strong>X[{s.xi}]='{s.charX}'</strong> vs <strong>Y[{s.yj}]='{s.charY}'</strong>
                    {' '}
                    {s.match
                      ? <span style={{ color: '#3ecf4f', fontWeight: 600 }}>✓ Match!</span>
                      : <span style={{ color: '#cf3e3e' }}>✗ No match</span>}
                    <br />
                    <span className="step-formula">{s.formula}</span>
                    {s.inPath && <span style={{ color: '#d4a017', marginLeft: '0.5rem', fontSize: '0.75rem' }}>★ LCS path</span>}
                  </div>
                  <div className="step-cost">{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DP Table with highlighted cells */}
          <div className="section-heading">Dynamic Programming Table</div>
          <div className="alert alert-info" style={{ marginBottom: '0.6rem' }}>
            Rows: Sequence 1 (X) &nbsp;·&nbsp; Columns: Sequence 2 (Y) &nbsp;·&nbsp;
            <span style={{ color: '#d4a017' }}>Gold = backtrack path</span>
          </div>
          <div className="data-table-wrap anim-fade-in">
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
                      <td key={ci} className={cellClass(ri, ci)}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
