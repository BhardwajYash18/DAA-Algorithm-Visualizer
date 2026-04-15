```python
"""
Flask REST API for Algorithm Visualizer
Run:  python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from algorithms import run_fractional_knapsack, run_kruskal, run_lcs, run_tsp

app = Flask(__name__)

# ✅ Proper CORS setup
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])


# ✅ Handle preflight requests globally (CRITICAL FIX)
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response


# ── health check ──────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ── Fractional Knapsack ───────────────────────────────────────────────────────
@app.route("/api/knapsack", methods=["POST"])
def knapsack_route():
    data = request.get_json()
    try:
        items    = [row["item"]   for row in data["items"]]
        weights  = [float(row["weight"]) for row in data["items"]]
        values   = [float(row["value"])  for row in data["items"]]
        capacity = float(data["capacity"])
        strategy = data.get("strategy", "ratio")

        if not items:
            return jsonify({"error": "Please add at least one item."}), 400
        if any(w <= 0 for w in weights):
            return jsonify({"error": "All weights must be greater than zero."}), 400

        result = run_fractional_knapsack(items, weights, values, capacity, strategy)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Kruskal MST ───────────────────────────────────────────────────────────────
@app.route("/api/kruskal", methods=["POST"])
def kruskal_route():
    data = request.get_json()
    try:
        n     = int(data["n"])
        edges = [(int(e["u"]), int(e["v"]), int(e["w"])) for e in data["edges"]]

        if not edges:
            return jsonify({"error": "Please enter at least one edge."}), 400

        result = run_kruskal(n, edges)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── LCS ───────────────────────────────────────────────────────────────────────
@app.route("/api/lcs", methods=["POST"])
def lcs_route():
    data = request.get_json()
    try:
        X = data.get("X", "").strip()
        Y = data.get("Y", "").strip()

        if not X or not Y:
            return jsonify({"error": "Please enter both strings."}), 400

        result = run_lcs(X, Y)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── TSP ───────────────────────────────────────────────────────────────────────
@app.route("/api/tsp", methods=["POST"])
def tsp_route():
    data = request.get_json()
    try:
        cities     = data["cities"]
        start      = int(data.get("start", 0))
        city_names = [c["city"] for c in cities]
        coords     = [(float(c["x"]), float(c["y"])) for c in cities]

        if len(cities) < 3:
            return jsonify({"error": "Please enter at least 3 cities."}), 400

        result = run_tsp(city_names, coords, start)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run app ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
```
