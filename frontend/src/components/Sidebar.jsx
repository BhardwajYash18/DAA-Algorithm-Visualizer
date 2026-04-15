import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',          icon: '🏠', label: 'Home' },
  { to: '/knapsack',  icon: '🎒', label: 'Fractional Knapsack' },
  { to: '/kruskal',   icon: '🌉', label: 'Kruskal MST' },
  { to: '/lcs',       icon: '💬', label: 'Longest Common Subsequence' },
  { to: '/tsp',       icon: '🗺️', label: 'Travelling Salesman' },
]

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        ⚙ Algorithm<br />Visualizer
        <span>Interactive DAA Platform</span>
      </div>
      <div className="sidebar-divider" />
      {links.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
