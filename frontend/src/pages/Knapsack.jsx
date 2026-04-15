import { useState } from 'react'

const API = 'https://daa-algorithm-visualizer.onrender.com'

const DEFAULT_ITEMS = [
  { item: 'A', weight: '2', value: '10' },
  { item: 'B', weight: '3', value: '5'  },
  { item: 'C', weight: '5', value: '15' },
  { item: 'D', weight: '7', value: '7'  },
  { item: 'E', weight: '1', value: '6'  },
]

const STRATEGIES = [
  { value: 'ratio',  label: '📊 Max Value/Weight Ratio' },
  { value: 'value',  label: '💰 Max Value First' },
  { value: 'weight', label: '⚖️ Min Weight First' },
]

export default function Knapsack() {
  const [items,    setItems]    = useState(DEFAULT_ITEMS)
  const [capacity, setCapacity] = useState(10)
  const [strategy, setStrategy] = useState('ratio')
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  /* ── item table helpers ── */
  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row))
  }
  const addItem    = () => setItems(prev => [...prev, { item: '', weight: '', value: '' }])
  const removeItem = idx => setItems(prev => prev.filter((_, i) => i !== idx))

  /* ── run algorithm ── */
  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    try {
      const res = await fetch(`${API}/knapsack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, capacity: Number(capacity), strategy }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
    } catch (err) {
      setError('Could not connect to the backend. Is Flask running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
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
              <th>Value</th>
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
        <>
          <div className="gold-divider" />

          {/* Metric banner */}
          <div className="metric-banner">
            <div className="metric-item">
              <div className="label">Total Value Earned</div>
              <div className="value">{result.total_value}</div>
              <div className="unit">value units</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">Weight Used</div>
              <div className="value" style={{ fontSize: '1.5rem' }}>{result.total_weight_used} <span style={{ fontSize: '1rem', color: '#555' }}>/ {result.capacity}</span></div>
              <div className="unit">weight units</div>
            </div>
          </div>

          {/* Selection breakdown */}
          <div className="section-heading">Selection Breakdown</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>{Object.keys(result.rows[0] || {}).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart */}
          <div className="section-heading">Visualisation</div>
          <img className="chart-img" src={`data:image/png;base64,${result.chart_b64}`} alt="Knapsack chart" />
        </>
      )}
    </div>
  )
}
