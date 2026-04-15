import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Knapsack from './pages/Knapsack'
import KruskalMST from './pages/KruskalMST'
import LCS from './pages/LCS'
import TSP from './pages/TSP'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/knapsack" element={<Knapsack />} />
            <Route path="/kruskal"  element={<KruskalMST />} />
            <Route path="/lcs"      element={<LCS />} />
            <Route path="/tsp"      element={<TSP />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
