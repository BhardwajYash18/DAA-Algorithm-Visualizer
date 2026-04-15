import { useState } from 'react'

const API = 'http://localhost:5000/api'

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

  const updateCity = (idx, field, val) =>
    setCities(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  const addCity    = () => setCities(prev => [...prev, { city: '', x: '', y: '' }])
  const removeCity = idx => setCities(prev => prev.filter((_, i) => i !== idx))

  const run = async () => {
    setError(null); setResult(null); setLoading(true)
    try {
      const res = await fetch(`${API}/tsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities, start: Number(start) }),
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
      <h1 className="page-title">🗺️ Travelling Salesman Problem (TSP)</h1>
      <p className="page-subtitle">
        <strong className="text-gold">Real-Life Application:</strong> Used in logistics, delivery route planning,
        circuit board drilling, and any scenario requiring the shortest round-trip visiting every location once.
      </p>
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
        {loading ? '⏳ Solving…' : '▶ Solve TSP'}
      </button>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          Finding optimal tour…
        </div>
      )}

      {error && <div className="alert alert-error mt-2">{error}</div>}

      {result && (
        <>
          <div className="gold-divider" />

          {/* Metric banner */}
          <div className="metric-banner">
            <div className="metric-item">
              <div className="label">Total Tour Cost</div>
              <div className="value">{result.total_cost}</div>
              <div className="unit">distance units</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="label">Tour Route</div>
              <div style={{ color: '#e0e0e0', fontSize: '0.95rem', fontWeight: 500, marginTop: '0.3rem', lineHeight: 1.8 }}>
                {result.tour.join(' → ')}
              </div>
            </div>
          </div>

          {/* Tour chart */}
          <div className="section-heading">Nearest-Neighbour Tour Visualisation</div>
          <img className="chart-img" src={`data:image/png;base64,${result.tour_chart_b64}`} alt="TSP tour" />

          {/* Distance matrix */}
          <div className="section-heading">Distance Matrix</div>
          <div className="data-table-wrap">
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

          {/* Step-by-step */}
          <div className="section-heading">Tour — Step-by-Step</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>{Object.keys(result.steps[0] || {}).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.steps.map((step, i) => (
                  <tr key={i}>{Object.values(step).map((v, j) => <td key={j}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
