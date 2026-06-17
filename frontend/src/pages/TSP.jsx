import { useState, useEffect, useRef } from 'react'

const API = 'https://daa-algorithm-visualizer.onrender.com/api'

const DEFAULT_CITIES = [
  { city: 'A', x: '0',  y: '0'  },
  { city: 'B', x: '3',  y: '4'  },
  { city: 'C', x: '6',  y: '1'  },
  { city: 'D', x: '2',  y: '7'  },
  { city: 'E', x: '8',  y: '6'  },
  { city: 'F', x: '5',  y: '10' },
  { city: 'G', x: '10', y: '3'  },
]

export default function TSP() {
  const [cities, setCities] = useState(DEFAULT_CITIES)
  const [start,  setStart]  = useState(0)
  const [result, setResult] = useState(null)
  const [loading,setLoading]= useState(false)
  const [error,  setError]  = useState(null)

  // Step playback
  const [dpSteps,    setDpSteps]    = useState([])
  const [activeStep, setActiveStep] = useState(-1)
  const [playing,    setPlaying]    = useState(false)
  const intervalRef = useRef(null)

  const updateCity = (idx, field, val) =>
    setCities(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  const addCity    = () => setCities(prev => [...prev, { city: '', x: '', y: '' }])
  const removeCity = idx => setCities(prev => prev.filter((_, i) => i !== idx))

  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    setDpSteps([]); setActiveStep(-1); setPlaying(false)
    clearInterval(intervalRef.current)
    try {
      const res = await fetch(`${API}/tsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities, start: Number(start) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
      if (data.dp_steps && data.dp_steps.length > 0) {
        setDpSteps(data.dp_steps)
        setActiveStep(0)
      }
    } catch {
      setError('Could not connect to the backend. Is Flask running?')
    } finally {
      setLoading(false)
    }
  }

  /* auto-play */
  useEffect(() => {
    if (!playing || dpSteps.length === 0) return
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= dpSteps.length - 1) { setPlaying(false); return prev }
        return prev + 1
      })
    }, 600)
    return () => clearInterval(intervalRef.current)
  }, [playing, dpSteps])

  const stepClass = (i) => {
    if (i < activeStep) return 'step-row step-done'
    if (i === activeStep) return 'step-row step-active'
    return 'step-row step-future'
  }

  const totalCost = result ? result.total_cost : 0
  const activeS   = dpSteps[activeStep] || null

  return (
    <div className="page-enter">
      <h1 className="page-title">
        🗺️ Travelling Salesman Problem (TSP)
        <span className="algo-tag-chip">Held-Karp DP</span>
      </h1>
      <p className="page-subtitle">
        <strong className="text-gold">Real-Life Application:</strong> Used in logistics, delivery route planning,
        circuit board drilling, and any scenario requiring the shortest round-trip visiting every location once.
      </p>
      <div className="alert alert-info" style={{ marginBottom: '0.8rem', marginTop: '0.6rem' }}>
        ⚡ Now using <strong>Held-Karp Dynamic Programming</strong> — an exact O(n²·2ⁿ) algorithm
        that guarantees the optimal tour. Suitable for up to ~15 cities.
      </div>
      <div className="gold-divider" />

      {/* City editor */}
      <div className="section-heading">City Coordinates</div>
      <div className="edit-table-wrap">
        <table className="edit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>City</th>
              <th>X</th>
              <th>Y</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cities.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#555', width: 28, textAlign: 'center' }}>{i}</td>
                <td><input className="cell-input" value={row.city} onChange={e => updateCity(i, 'city', e.target.value)} placeholder="City" /></td>
                <td><input className="cell-input" value={row.x}    onChange={e => updateCity(i, 'x',    e.target.value)} placeholder="0" type="number" step="any" /></td>
                <td><input className="cell-input" value={row.y}    onChange={e => updateCity(i, 'y',    e.target.value)} placeholder="0" type="number" step="any" /></td>
                <td><button className="cell-del" onClick={() => removeCity(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost" style={{ marginBottom: '1.2rem' }} onClick={addCity}>＋ Add City</button>

      <div className="form-group">
        <label className="form-label">Start City Index</label>
        <input className="form-input" style={{ width: 120 }} type="number" min={0}
          max={Math.max(0, cities.length - 1)} value={start}
          onChange={e => setStart(e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={run} disabled={loading}>
        {loading ? '⏳ Solving…' : '▶ Solve TSP (Held-Karp DP)'}
      </button>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          Running Held-Karp DP…
        </div>
      )}

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {result && (
        <div className="result-enter">
          <div className="gold-divider" />

          {/* Metric banner */}
          <div className="metric-banner anim-fade-in-up">
            <div className="metric-item">
              <div className="label">Optimal Tour Cost</div>
              <div className="value anim-count-up">{result.total_cost}</div>
              <div className="unit">distance units</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">Optimal Tour Route</div>
              <div style={{ color: '#e0e0e0', fontSize: '0.9rem', fontWeight: 500,
                marginTop: '0.3rem', lineHeight: 1.9 }}>
                {result.tour.map((city, i) => (
                  <span key={i}>
                    <span style={{
                      animation: `rowIn 0.3s ease ${i * 0.07}s both`,
                      display: 'inline-block',
                      color: i === 0 || i === result.tour.length - 1 ? '#3ecf4f' : '#f0c040',
                      fontWeight: i === 0 ? 700 : 500,
                    }}>{city}</span>
                    {i < result.tour.length - 1 && <span style={{ color: '#555', margin: '0 0.3rem' }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* DP Step panel */}
          {dpSteps.length > 0 && (
            <>
              <div className="section-heading" style={{ marginTop: '1.4rem' }}>
                Held-Karp DP — Optimal Path Decisions
              </div>
              <div className="alert alert-info" style={{ marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                💡 Each step shows the DP state: <strong>dp[visited-set][city]</strong> — the minimum cost to reach that city having visited that subset.
                The algorithm picks the globally optimal next city at each stage.
              </div>

              <div className="playback-bar">
                <button className="btn-xs" onClick={() => setActiveStep(0)}>⏮ Reset</button>
                <button
                  className={`btn-xs${playing ? ' active' : ''}`}
                  onClick={() => {
                    if (activeStep >= dpSteps.length - 1) setActiveStep(0)
                    setPlaying(p => !p)
                  }}
                >
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button className="btn-xs" onClick={() => setActiveStep(p => Math.min(dpSteps.length - 1, p + 1))}>Step ▶</button>
                <span className="step-counter">Step {activeStep + 1} / {dpSteps.length}</span>
              </div>

              {/* Live progress bar for cumulative cost */}
              {activeS && (
                <>
                  <div className="progress-label">
                    <span>Cumulative tour cost so far</span>
                    <span>{activeS.cumulative} / {totalCost}</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, (activeS.cumulative / totalCost) * 100)}%` }}
                    />
                  </div>
                </>
              )}

              <div className="steps-panel">
                <div className="steps-panel-header">
                  <span className="sp-title">🧮 DP Subproblem Transitions</span>
                  <span className="sp-badge">Held-Karp · Bitmask DP</span>
                </div>
                <div className="steps-panel-body">
                  {dpSteps.map((s, i) => (
                    <div
                      key={i}
                      className={stepClass(i)}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="step-num">{i < activeStep ? '✓' : i + 1}</div>
                      <div className="step-body">
                        <strong>{s.from}</strong> → <strong>{s.to}</strong>
                        <span style={{ color: '#555', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                          dist: {s.leg_dist}
                        </span>
                        <br />
                        <span className="step-formula">
                          dp[{s.mask}][{s.to.replace(' (return)', '')}] = {s.dp_value}
                        </span>
                        {s.candidates && s.candidates.length > 1 && (
                          <span style={{ color: '#555', marginLeft: '0.5rem', fontSize: '0.76rem' }}>
                            · Alternatives: {s.candidates.slice(1).map(([d, c]) => `${c}(${d})`).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="step-cost">Σ {s.cumulative}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tour chart */}
          <div className="section-heading">Optimal Tour Visualisation</div>
          <img className="chart-img anim-fade-in" src={`data:image/png;base64,${result.tour_chart_b64}`} alt="TSP tour" />

          {/* Distance matrix */}
          <div className="section-heading">Distance Matrix</div>
          <div className="data-table-wrap anim-fade-in">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  {result.dm_labels.map((l, i) => <th key={i}>{l}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.distance_matrix.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ color: '#d4a017', fontWeight: 600 }}>{result.dm_labels[ri]}</td>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ color: ri === ci ? '#333' : undefined }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Step-by-step plain table */}
          <div className="section-heading">Tour — Step-by-Step</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>{Object.keys(result.steps[0] || {}).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.steps.map((step, i) => (
                  <tr key={i} style={{ animation: `rowIn 0.3s ease ${i * 0.06}s both` }}>
                    {Object.values(step).map((v, j) => <td key={j}>{v}</td>)}
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
