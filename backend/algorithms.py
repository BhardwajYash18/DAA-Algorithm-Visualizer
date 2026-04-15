"""
algorithms.py  —  Pure Python algorithm implementations
All computation and chart generation lives here; Flask just calls these.
"""

import math
import base64
import io

import matplotlib
matplotlib.use("Agg")          # non-interactive backend (no GUI)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import networkx as nx
import numpy as np


# ── palette constants ──────────────────────────────────────────────────────────
GOLD   = "#d4a017"
GOLD_L = "#f0c040"
GOLD_D = "#a07810"
BG     = "#111111"
CARD   = "#161616"
WHITE  = "#e0e0e0"
DARK   = "#0a0a0a"


# ── helpers ───────────────────────────────────────────────────────────────────
def _fig_to_b64(fig) -> str:
    """Render a matplotlib figure to a base64 PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=110,
                facecolor=fig.get_facecolor())
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def _style_fig(fig, axes=None):
    """Apply dark-gold theme to any matplotlib figure."""
    fig.patch.set_facecolor(BG)
    axes = axes if axes else fig.get_axes()
    for ax in axes:
        ax.set_facecolor(CARD)
        ax.tick_params(colors=WHITE, labelsize=9)
        ax.xaxis.label.set_color(WHITE)
        ax.yaxis.label.set_color(WHITE)
        for spine in ax.spines.values():
            spine.set_edgecolor(GOLD)
        ax.title.set_color(GOLD_L)
        ax.title.set_fontweight("bold")
    fig.tight_layout()
    return fig


# ══════════════════════════════════════════════════════════════════════════════
#  FRACTIONAL KNAPSACK
# ══════════════════════════════════════════════════════════════════════════════

def run_fractional_knapsack(items, weights, values, capacity, strategy="ratio"):
    """
    Fractional knapsack with three greedy strategies.

    Returns
    -------
    dict  with keys: total_value, total_weight_used, rows, chart_b64
    """
    item_data = []
    for i in range(len(items)):
        ratio = values[i] / weights[i] if weights[i] != 0 else float("inf")
        item_data.append({"idx": i, "item": items[i],
                          "weight": weights[i], "value": values[i],
                          "ratio": ratio})

    if strategy == "ratio":
        item_data.sort(key=lambda x: x["ratio"], reverse=True)
    elif strategy == "value":
        item_data.sort(key=lambda x: x["value"], reverse=True)
    else:  # weight
        item_data.sort(key=lambda x: x["weight"])

    remaining = float(capacity)
    total_value = 0.0
    result_rows = []
    bar_fractions = [0.0] * len(items)

    for entry in item_data:
        if remaining <= 0:
            break
        take = min(entry["weight"], remaining)
        frac = take / entry["weight"]
        earned = frac * entry["value"]
        total_value += earned
        remaining -= take
        bar_fractions[entry["idx"]] = frac
        result_rows.append({
            "Item":          entry["item"],
            "Weight":        entry["weight"],
            "Value":         entry["value"],
            "V/W Ratio":     round(entry["ratio"], 3),
            "Weight Taken":  round(take, 3),
            "Fraction Used": f"{frac*100:.1f}%",
            "Value Earned":  round(earned, 3),
        })

    total_weight_used = float(capacity) - remaining

    # ── chart ──────────────────────────────────────────────────────────────────
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    item_labels = items

    frac_colors = ["#d4a017" if f >= 1.0 else
                   "#a07810" if f > 0    else "#2a2a2a"
                   for f in bar_fractions]

    ax1.bar(item_labels, values, color=frac_colors,
            edgecolor=GOLD_L, linewidth=0.8)
    ax1.set_xlabel("Items")
    ax1.set_ylabel("Total Value")
    ax1.set_title("Item Values (Gold=Full · Dark=Partial · Grey=Skipped)")

    frac_vals = [f * 100 for f in bar_fractions]
    ax2.bar(item_labels, frac_vals,
            color=["#d4a017" if f > 0 else "#2a2a2a" for f in bar_fractions],
            edgecolor=GOLD_L, linewidth=0.8)
    ax2.set_xlabel("Items")
    ax2.set_ylabel("% of Item Taken")
    ax2.set_ylim(0, 110)
    ax2.set_title("Fraction of Each Item Selected (%)")

    _style_fig(fig, [ax1, ax2])
    chart_b64 = _fig_to_b64(fig)

    return {
        "total_value":        round(total_value, 3),
        "total_weight_used":  round(total_weight_used, 3),
        "capacity":           capacity,
        "rows":               result_rows,
        "chart_b64":          chart_b64,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  KRUSKAL MST
# ══════════════════════════════════════════════════════════════════════════════

class DisjointSet:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px != py:
            self.parent[py] = px
            return True
        return False


def kruskal_mst(n, edges):
    edges_sorted = sorted(edges, key=lambda x: x[2])
    ds = DisjointSet(n)
    mst = []
    cost = 0
    for u, v, w in edges_sorted:
        if ds.union(u, v):
            mst.append((u, v, w))
            cost += w
    return cost, mst


def run_kruskal(n, edges):
    """
    Returns
    -------
    dict  with keys: cost, mst_edges, original_chart_b64, mst_chart_b64
    """
    cost, mst = kruskal_mst(n, edges)

    G_all = nx.Graph()
    for i in range(n):
        G_all.add_node(i)
    G_all.add_weighted_edges_from(edges)

    G_mst = nx.Graph()
    for i in range(n):
        G_mst.add_node(i)
    G_mst.add_weighted_edges_from(mst)

    pos = nx.spring_layout(G_all, seed=42)
    edge_labels     = {(u, v): w for u, v, w in edges}
    mst_edge_labels = {(u, v): w for u, v, w in mst}

    def _draw_graph(G, labels, highlight_mst=False):
        fig, ax = plt.subplots(figsize=(6, 5))
        fig.patch.set_facecolor(BG)
        ax.set_facecolor(CARD)
        nx.draw(G, pos, with_labels=True, node_color=GOLD,
                node_size=700, font_weight="bold", font_color=DARK,
                edge_color="#555555", ax=ax)
        nx.draw_networkx_edge_labels(G, pos, edge_labels=labels,
                                     font_color=GOLD_L, ax=ax)
        if highlight_mst:
            nx.draw_networkx_edges(G, pos, edge_color=GOLD,
                                   width=2.5, ax=ax)
        for spine in ax.spines.values():
            spine.set_edgecolor(GOLD)
        ax.set_facecolor(CARD)
        fig.tight_layout()
        return _fig_to_b64(fig)

    original_b64 = _draw_graph(G_all, edge_labels, highlight_mst=False)
    mst_b64      = _draw_graph(G_mst, mst_edge_labels, highlight_mst=True)

    return {
        "cost":               cost,
        "mst_edges":          [{"u": u, "v": v, "w": w} for u, v, w in mst],
        "original_chart_b64": original_b64,
        "mst_chart_b64":      mst_b64,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  LONGEST COMMON SUBSEQUENCE
# ══════════════════════════════════════════════════════════════════════════════

def lcs(X, Y):
    m, n = len(X), len(Y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            if X[i] == Y[j]:
                dp[i + 1][j + 1] = dp[i][j] + 1
            else:
                dp[i + 1][j + 1] = max(dp[i][j + 1], dp[i + 1][j])

    seq = []
    x_indices, y_indices = [], []
    i, j = m, n
    while i > 0 and j > 0:
        if X[i - 1] == Y[j - 1]:
            seq.append(X[i - 1])
            x_indices.append(i - 1)
            y_indices.append(j - 1)
            i -= 1; j -= 1
        elif dp[i - 1][j] > dp[i][j - 1]:
            i -= 1
        else:
            j -= 1

    seq.reverse(); x_indices.reverse(); y_indices.reverse()
    return dp[m][n], "".join(seq), dp, x_indices, y_indices


def _unique_labels(chars):
    seen, labels = {}, []
    for ch in chars:
        if ch not in seen:
            seen[ch] = 0
            labels.append(ch)
        else:
            seen[ch] += 1
            labels.append(f"{ch}.{seen[ch]}")
    return labels


def _plot_lcs_alignment(X, Y, x_indices, y_indices, seq) -> str:
    fig, ax = plt.subplots(figsize=(max(len(X), len(Y)) * 0.65, 3))
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(CARD)
    ax.set_ylim(0, 2)
    ax.set_xlim(-1, max(len(X), len(Y)) + 1)

    x_cols = [GOLD if i in x_indices else "#2a2418" for i in range(len(X))]
    y_cols = [GOLD if i in y_indices else "#2a2418" for i in range(len(Y))]

    for i, ch in enumerate(X):
        ax.text(i + 0.5, 1.5, ch, ha="center", va="center", fontsize=12,
                color=DARK if i in x_indices else WHITE,
                bbox=dict(boxstyle="square,pad=0.4", facecolor=x_cols[i],
                          edgecolor=GOLD, alpha=0.9))

    for i, ch in enumerate(Y):
        ax.text(i + 0.5, 0.5, ch, ha="center", va="center", fontsize=12,
                color=DARK if i in y_indices else WHITE,
                bbox=dict(boxstyle="square,pad=0.4", facecolor=y_cols[i],
                          edgecolor=GOLD, alpha=0.9))

    ax.text(-0.5, 1.5, "Seq 1:", ha="right", va="center",
            fontsize=10, weight="bold", color=GOLD)
    ax.text(-0.5, 0.5, "Seq 2:", ha="right", va="center",
            fontsize=10, weight="bold", color=GOLD)
    ax.set_title(f"LCS Alignment  ·  LCS: '{seq}'", fontsize=13,
                 color=GOLD_L, fontweight="bold")

    for k in range(len(x_indices)):
        line = plt.Line2D([x_indices[k] + 0.5, y_indices[k] + 0.5],
                          [1.3, 0.7],
                          color=GOLD, linestyle="--", alpha=0.7, linewidth=1.5)
        ax.add_line(line)

    for spine in ax.spines.values():
        spine.set_edgecolor(GOLD)
    ax.axis("off")
    fig.tight_layout()
    return _fig_to_b64(fig)


def run_lcs(X, Y):
    """
    Returns
    -------
    dict  with keys: length, sequence, dp_table (list of lists),
                     col_labels, row_labels, alignment_chart_b64
    """
    length, seq, dp, x_idx, y_idx = lcs(X, Y)

    alignment_b64 = _plot_lcs_alignment(X, Y, x_idx, y_idx, seq) if length > 0 else None

    col_labels = [""] + _unique_labels(list(Y))
    row_labels  = [""] + _unique_labels(list(X))

    return {
        "length":              length,
        "sequence":            seq,
        "x_indices":           x_idx,
        "y_indices":           y_idx,
        "dp_table":            dp,
        "col_labels":          col_labels,
        "row_labels":          row_labels,
        "alignment_chart_b64": alignment_b64,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  TRAVELLING SALESMAN PROBLEM
# ══════════════════════════════════════════════════════════════════════════════

def tsp_distance(cities):
    n = len(cities)
    dist = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            dx = cities[i][0] - cities[j][0]
            dy = cities[i][1] - cities[j][1]
            dist[i][j] = math.sqrt(dx * dx + dy * dy)
    return dist


def tsp_nearest_neighbour(dist, start=0):
    n = len(dist)
    visited = [False] * n
    tour = [start]
    visited[start] = True
    for _ in range(n - 1):
        curr = tour[-1]
        best_next, best_dist = -1, float("inf")
        for j in range(n):
            if not visited[j] and dist[curr][j] < best_dist:
                best_dist = dist[curr][j]
                best_next = j
        tour.append(best_next)
        visited[best_next] = True
    tour.append(start)
    return tour


def tsp_tour_length(tour, dist):
    return sum(dist[tour[i]][tour[i + 1]] for i in range(len(tour) - 1))


def _plot_tsp(cities, tour, title="TSP Tour") -> str:
    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(CARD)

    for i in range(len(tour) - 1):
        c1, c2 = cities[tour[i]], cities[tour[i + 1]]
        ax.plot([c1[0], c2[0]], [c1[1], c2[1]],
                color=GOLD, linewidth=2, zorder=1, alpha=0.85)

    xs = [c[0] for c in cities]
    ys = [c[1] for c in cities]
    ax.scatter(xs, ys, color=GOLD_L, s=120, zorder=3,
               edgecolors=DARK, linewidths=1.2)

    for idx, (x, y) in enumerate(cities):
        ax.text(x + 0.5, y + 0.5, str(idx), fontsize=9, color=DARK,
                bbox=dict(boxstyle="round,pad=0.2", facecolor=GOLD,
                          edgecolor="none", alpha=0.9))

    sx, sy = cities[tour[0]]
    ax.scatter([sx], [sy], color="#3ecf4f", s=200, zorder=4,
               edgecolors=DARK, linewidths=1.5)
    ax.text(sx + 0.5, sy - 1.5, "Start", fontsize=8, color="#3ecf4f")

    ax.set_title(title, fontsize=13, color=GOLD_L, fontweight="bold")
    ax.set_xlabel("X", color=WHITE, fontsize=10)
    ax.set_ylabel("Y", color=WHITE, fontsize=10)
    ax.tick_params(colors=WHITE, labelsize=8)
    for spine in ax.spines.values():
        spine.set_edgecolor(GOLD)

    fig.tight_layout()
    return _fig_to_b64(fig)


def run_tsp(city_names, coords, start=0):
    """
    Returns
    -------
    dict  with keys: total_cost, tour (names), steps, distance_matrix (rounded),
                     dm_row_labels, tour_chart_b64
    """
    dist_matrix = tsp_distance(coords)
    nn_tour     = tsp_nearest_neighbour(dist_matrix, start=int(start))
    nn_dist     = tsp_tour_length(nn_tour, dist_matrix)
    tour_names  = [city_names[i] for i in nn_tour]

    # Step-by-step table
    steps = []
    running = 0.0
    for i in range(len(nn_tour) - 1):
        frm = nn_tour[i]; to = nn_tour[i + 1]
        leg = round(dist_matrix[frm][to], 2)
        running += leg
        steps.append({
            "Step":            i + 1,
            "From":            city_names[frm],
            "To":              city_names[to],
            "Leg Distance":    leg,
            "Cumulative Cost": round(running, 2),
        })

    # Distance matrix (rounded, labelled)
    dm_rounded = [[round(dist_matrix[i][j], 2) for j in range(len(coords))]
                  for i in range(len(coords))]

    chart_b64 = _plot_tsp(
        coords, nn_tour,
        title=f"TSP — Nearest Neighbour  (Total: {nn_dist:.2f})"
    )

    return {
        "total_cost":       round(nn_dist, 2),
        "tour":             tour_names,
        "steps":            steps,
        "distance_matrix":  dm_rounded,
        "dm_labels":        city_names,
        "tour_chart_b64":   chart_b64,
    }
