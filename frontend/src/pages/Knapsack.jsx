import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:5000/api'

const DEFAULT_ITEMS = [
  { item: 'A', weight: '2', value: '10' },
  { item: 'B', weight: '3', value: '5'  },
  { item: 'C', weight: '5', value: '15' },
  { item: 'D', weight: '7', value: '7'  },
  { item: 'E', weight: '1', value: '6'  },
]

const STRATEGIES = [
  { value: 'ratio',  label: '📊 Max Profit/Weight Ratio' },
  { value: 'value',  label: '💰 Max Profit First' },
  { value: 'weight', label: '⚖️ Min Weight First' },
]

/* Build greedy steps from API rows */
function buildSteps(rows, capacity) {
  let remCap = capacity
  return rows.map((row, i) => {
    const taken  = parseFloat(row['Weight Taken'])
    const earned = parseFloat(row['Value Earned'])
    const frac   = row['Fraction Used']
    remCap -= taken
    return {
      idx: i + 1,
      label: row['Item'],
      weight: row['Weight'],
      value: row['Value'],
      ratio: row['V/W Ratio'],
      weightTaken: taken,
      frac,
      earned,
      remCap: Math.max(0, parseFloat(remCap.toFixed(3))),
    }
  })
}

export default function Knapsack() {
  const [items,    setItems]    = useState(DEFAULT_ITEMS)
  const [capacity, setCapacity] = useState(10)
  const [strategy, setStrategy] = useState('ratio')
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // Step playback
  const [steps,       setSteps]       = useState([])
  const [activeStep,  setActiveStep]  = useState(-1)
  const [playing,     setPlaying]     = useState(false)
  const intervalRef = useRef(null)

  /* ── item table helpers ── */
  const updateItem = (idx, field, val) =>
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row))
  const addItem    = () => setItems(prev => [...prev, { item: '', weight: '', value: '' }])
  const removeItem = idx => setItems(prev => prev.filter((_, i) => i !== idx))

  /* ── run algorithm ── */
  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    setSteps([]); setActiveStep(-1); setPlaying(false)
    clearInterval(intervalRef.current)
    try {
      const res = await fetch(`${API}/knapsack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, capacity: Number(capacity), strategy }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
      const built = buildSteps(data.rows, Number(capacity))
      setSteps(built)
      setActiveStep(0)
    } catch {
      setError('Could not connect to the backend. Is Flask running?')
    } finally {
      setLoading(false)
    }
  }

  /* ── auto-play ── */
  useEffect(() => {
    if (!playing || steps.length === 0) return
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= steps.length - 1) { setPlaying(false); return prev }
        return prev + 1
      })
    }, 550)
    return () => clearInterval(intervalRef.current)
  }, [playing, steps])

  const stepClass = (i) => {
    if (i < activeStep) return 'step-row step-done'
    if (i === activeStep) return 'step-row step-active'
    return 'step-row step-future'
  }

  const pct = result
    ? Math.min(100, (result.total_weight_used / result.capacity) * 100)
    : 0

  return (
    <div className="page-enter">
      <h1 className="page-title">🎒 Fractional Knapsack Problem</h1>
      <p className="page-subtitle">
        <strong className="text-gold">Real-Life Application:</strong> Unlike 0/1 Knapsack, fractional items are
        allowed — used in commodities trading, liquid-cargo loading, and resource allocation.
      </p>
      <div className="gold-divider" />

      {/* Items editor */}
      <div className="section-heading">Items Table</div>
      <div className="edit-table-wrap">
        <table className="edit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Weight</th>
              <th>Profit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#555', width: 28, textAlign: 'center' }}>{i + 1}</td>
                <td><input className="cell-input" value={row.item}   onChange={e => updateItem(i, 'item',   e.target.value)} placeholder="Name" /></td>
                <td><input className="cell-input" value={row.weight} onChange={e => updateItem(i, 'weight', e.target.value)} placeholder="0" type="number" min="0.01" step="any" /></td>
                <td><input className="cell-input" value={row.value}  onChange={e => updateItem(i, 'value',  e.target.value)} placeholder="0" type="number" min="0"    step="any" /></td>
                <td><button className="cell-del" onClick={() => removeItem(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost" style={{ marginBottom: '1.2rem' }} onClick={addItem}>＋ Add Item</button>

      {/* Capacity */}
      <div className="form-group">
        <label className="form-label">Knapsack Capacity (weight limit)</label>
        <input className="form-input" style={{ width: 160 }} type="number" min={1} max={5000}
          value={capacity} onChange={e => setCapacity(e.target.value)} />
      </div>

      {/* Strategy */}
      <div className="form-group">
        <label className="form-label">Greedy Strategy</label>
        <div className="radio-group">
          {STRATEGIES.map(s => (
            <label key={s.value} className={`radio-label${strategy === s.value ? ' selected' : ''}`}>
              <input type="radio" value={s.value} checked={strategy === s.value}
                onChange={() => setStrategy(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={run} disabled={loading}>
        {loading ? '⏳ Running…' : '▶ Run Fractional Knapsack'}
      </button>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          Computing result…
        </div>
      )}

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {result && (
        <div className="result-enter">
          <div className="gold-divider" />

          {/* Metric banner */}
          <div className="metric-banner anim-fade-in-up">
            <div className="metric-item">
              <div className="label">Total Value Earned</div>
              <div className="value anim-count-up">{result.total_value}</div>
              <div className="unit">value units</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">Weight Used</div>
              <div className="value anim-count-up anim-delay-2" style={{ fontSize: '1.5rem' }}>
                {result.total_weight_used} <span style={{ fontSize: '1rem', color: '#555' }}>/ {result.capacity}</span>
              </div>
              <div className="unit">weight units</div>
            </div>
          </div>

          {/* Capacity progress bar */}
          <div className="progress-label">
            <span>Capacity Used</span>
            <span>{result.total_weight_used} / {result.capacity} ({pct.toFixed(1)}%)</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>

          {/* Step panel */}
          <div className="section-heading" style={{ marginTop: '1.4rem' }}>
            Greedy Selection — Step by Step
          </div>

          {/* Playback controls */}
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
              <span className="sp-title">🏷️ Item Processing Order</span>
              <span className="sp-badge">Greedy · {strategy === 'ratio' ? 'V/W Ratio' : strategy === 'value' ? 'Max Value' : 'Min Weight'}</span>
            </div>
            <div className="steps-panel-body">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={stepClass(i)}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="step-num">{i < activeStep ? '✓' : i + 1}</div>
                  <div className="step-body">
                    <strong>{s.label}</strong>
                    {' — '}
                    Take <strong>{s.frac}</strong> of item
                    {' '}(wt: {s.weight}, val: {s.value})
                    <br />
                    <span className="step-formula">
                      Take {s.weightTaken} → Earn {s.earned} | Remaining cap: {s.remCap}
                    </span>
                  </div>
                  <div className="step-cost">+{s.earned}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Selection breakdown */}
          <div className="section-heading">Selection Breakdown</div>
          <div className="data-table-wrap anim-fade-in">
            <table className="data-table">
              <thead>
                <tr>{Object.keys(result.rows[0] || {}).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} style={{ animation: `rowIn 0.3s ease ${i * 0.05}s both` }}>
                    {Object.values(row).map((v, j) => <td key={j}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart */}
          <div className="section-heading">Visualisation</div>
          <img className="chart-img anim-fade-in" src={`data:image/png;base64,${result.chart_b64}`} alt="Knapsack chart" />
        </div>
      )}
    </div>
  )
}
