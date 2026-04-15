import { useNavigate } from 'react-router-dom'

const algorithms = [
  {
    icon: '🎒',
    title: 'Fractional Knapsack',
    desc: 'Greedy item selection — by max value, min weight, or best ratio — allowing fractional items.',
    path: '/knapsack',
    tag: 'Greedy',
  },
  {
    icon: '🌉',
    title: 'Minimum Spanning Tree (Kruskal)',
    desc: 'Greedy algorithm to build an MST in a weighted graph with minimum total connection cost.',
    path: '/kruskal',
    tag: 'Greedy',
  },
  {
    icon: '💬',
    title: 'Longest Common Subsequence',
    desc: 'DP approach to find the longest shared subsequence between two strings or DNA strands.',
    path: '/lcs',
    tag: 'Dynamic Programming',
  },
  {
    icon: '🗺️',
    title: 'Travelling Salesman Problem',
    desc: 'Nearest-Neighbour heuristic to find the shortest round-trip that visits all cities exactly once.',
    path: '/tsp',
    tag: 'Heuristic',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-badge">⚡ DAA Algorithm Visualizer</div>
        <h1 className="page-title">🧩 Algorithm Visualizer</h1>
        <p className="page-subtitle">
          An interactive platform to explore, run, and visualize classic algorithms.
          Pick an algorithm below to get started.
        </p>
      </div>

      <div className="gold-divider" />

      <p className="text-dim text-sm" style={{ marginBottom: '1rem' }}>
        👇 Click an algorithm card to jump straight in:
      </p>

      <div className="algo-grid">
        {algorithms.map(({ icon, title, desc, path, tag }) => (
          <div
            key={path}
            className="algo-card"
            onClick={() => navigate(path)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(path)}
          >
            <div className="algo-card-icon">{icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div className="algo-card-title">{title}</div>
              <span style={{
                background: 'rgba(212,160,23,0.15)',
                border: '1px solid rgba(212,160,23,0.3)',
                color: '#d4a017',
                fontSize: '0.66rem',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                borderRadius: '20px',
              }}>{tag}</span>
            </div>
            <div className="algo-card-desc">{desc}</div>
          </div>
        ))}
      </div>

      <div className="gold-divider" />
      <p className="text-dim text-sm" style={{ textAlign: 'center' }}>
        You can also pick any algorithm from the sidebar on the left.
      </p>
    </div>
  )
}
