# ⚙️ Algorithm Visualizer

An interactive platform to explore, run, and visualize classic Design and Analysis of Algorithms (DAA) concepts. The application features a dark-gold aesthetic and provides visual breakdown, steps, and chart analysis for different algorithms.

## 🧩 Featured Algorithms

*   **🎒 Fractional Knapsack:** Greedy item selection allowing fractional items to maximize total value, minimum weight, or optimal value-to-weight ratio.
*   **🌉 Minimum Spanning Tree (Kruskal's Algorithm):** Greedy technique to find the MST connecting nodes with the minimum total connection cost.
*   **💬 Longest Common Subsequence (LCS):** Dynamic Programming approach to find the longest shared subsequence between two sequences/strings, plotting an alignment grid.
*   **🗺️ Travelling Salesman Problem (TSP):** Nearest-Neighbour heuristic routing to discover the shortest round-trip path that visits each city exactly once.

---

## 🏗️ Technical Stack

- **Frontend:** React + Vite 
- **Backend:** Python + Flask (REST API)
- **Charting Engine:** Matplotlib (Server-side rendering)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have both [Node.js](https://nodejs.org/) (for npm) and [Python](https://www.python.org/) installed on your machine.

### 1. Install Dependencies
This project uses a unified script to install dependencies for both the frontend and the backend.
From the root directory, run:
```bash
npm install
npm run install:all
```
*(This commands installs `concurrently` in the root, `react` dependencies in `/frontend`, and python `pip` libraries in `/backend`)*

### 2. Run the Application
Start both the Flask Backend and the React Frontend simultaneously by running:
```bash
npm start
```
- **Frontend** will be running at: `http://localhost:5173/`
- **Backend** will be running at: `http://localhost:5000/`

Open `http://localhost:5173/` in your browser to interact with the Visualizer!
