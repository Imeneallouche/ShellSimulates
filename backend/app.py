import os
import shutil
import tempfile
import subprocess
from flask import Flask, request, jsonify
from jinja2 import Environment, FileSystemLoader
import math
from flask_cors import CORS
import heapq
from typing import List, Dict


app = Flask(__name__)
CORS(app)  # Enable CORS for React


# System parameters
V_FIBER = 2e8  # m/s in fiber optics :contentReference[oaicite:3]{index=3}
LAMBDA_P = 10  # pkt/s per UE
MU_GNB = 1000  # pkt/s per gNB server
PROCESS_GNB = 0.001  # fixed processing (s) at gNB before queue :contentReference[oaicite:4]{index=4}
L_BITS = 32 * 8  # packet size in bits
EPS = 1e-12  # to avoid log(0)


# /*//////////////////////////////////////////////////////////////
#                            COMPUTE LATENCY
# //////////////////////////////////////////////////////////////*/
def compute_latencies_to_pdn(
    nbgNB: int,
    nbUPF: int,
    nbUE: int,
    distances: List[List[str]],
    links: List[List[str]],
    pdnLinks: List[str],
) -> List[float]:
    """
    Returns a list of length nbUE of expected latencies (s) for each UE → PDN message.
    Assumes UEs are uniformly assigned to gNBs: UE count per gNB = floor(nbUE/nbgNB) + extras.
    """
    # 1) Determine UE distribution per gNB
    base, extra = divmod(nbUE, nbgNB)
    ues_per_gnb = [base + (1 if i < extra else 0) for i in range(nbgNB)]

    # 2) Precompute gNB queue delays t_queue[j]
    #    t_queue = PROCESS_GNB + 1/(MU_GNB - λ), where λ = N_UE_j * LAMBDA_P
    t_queue = []
    for j in range(nbgNB):
        lam = ues_per_gnb[j] * LAMBDA_P
        if MU_GNB <= lam:
            raise ValueError(f"gNB {j} overloaded: λ={lam} ≥ μ={MU_GNB}")
        t_queue.append(
            PROCESS_GNB + 1.0 / (MU_GNB - lam)
        )  # :contentReference[oaicite:5]{index=5}

    # 3) Build UPF graph: nodes 0..nbUPF-1, plus PDN as node nbUPF
    N = nbUPF + 1  # last index = PDN
    adj = [[] for _ in range(N)]

    # 3a) UPF ↔ UPF edges
    for i in range(nbUPF):
        for j in range(nbUPF):
            dij = links[i][j]
            if dij != "" and not math.isnan(float(dij)):
                d = float(dij)
                w = d / V_FIBER  # propagation :contentReference[oaicite:6]{index=6}
                adj[i].append((j, w))

    # 3b) UPF → PDN edges
    PDN = nbUPF
    for i in range(nbUPF):
        dstr = pdnLinks[i]
        if dstr != "" and not math.isnan(float(dstr)):
            d = float(dstr)
            w = d / V_FIBER
            adj[i].append((PDN, w))

    # 4) Dijkstra: compute shortest UPF→PDN delays
    def dijkstra(source: int) -> List[float]:
        dist = [math.inf] * N
        dist[source] = 0.0
        heap = [(0.0, source)]
        while heap:
            cd, u = heapq.heappop(heap)
            if cd > dist[u]:
                continue
            for v, w in adj[u]:
                nd = cd + w
                if nd < dist[v]:
                    dist[v] = nd
                    heapq.heappush(heap, (nd, v))
        return dist

    # 5) Precompute for every UPF the minimal UPF→PDN propagation delay
    upf_to_pdn_delay = [
        dijkstra(i)[PDN] for i in range(nbUPF)
    ]  # :contentReference[oaicite:7]{index=7}

    # 6) For each UE on gNB j, find best path via any linked UPF i
    ue_latencies = []
    for j in range(nbgNB):
        # find all UPFs linked to gNB j
        for _ in range(ues_per_gnb[j]):
            best = math.inf
            for i in range(nbUPF):
                dstr = distances[j][i]
                if dstr != "" and not math.isnan(float(dstr)):
                    d = float(dstr)
                    t_prop = d / V_FIBER  # :contentReference[oaicite:8]{index=8}
                    total = t_queue[j] + t_prop + upf_to_pdn_delay[i]
                    if total < best:
                        best = total
            if best == math.inf:
                # no path to PDN
                ue_latencies.append(math.inf)
            else:
                ue_latencies.append(best)
    return ue_latencies


# /*//////////////////////////////////////////////////////////////
#                      COMPUTE RELIABILITY
# //////////////////////////////////////////////////////////////*/
def qfunc(x: float) -> float:
    """Tail probability of standard normal distribution."""
    return 0.5 * math.erfc(x / math.sqrt(2))


def link_reliability(d_str: str) -> float:
    """
    Compute R_link for a link distance given as string.
    Returns 0.0 if d_str is empty or invalid.
    """
    try:
        d = float(d_str)
    except (ValueError, TypeError):
        return 0.0
    # Approximate SNR ∝ 1/d^2 (normalized) :contentReference[oaicite:6]{index=6}
    snr = 1.0 / (d**2 + EPS)
    ber = qfunc(math.sqrt(2 * snr))  # :contentReference[oaicite:7]{index=7}
    return (1.0 - ber) ** L_BITS  # :contentReference[oaicite:8]{index=8}


def compute_reliabilities_to_pdn(
    nbgNB: int,
    nbUPF: int,
    nbUE: int,
    distances: List[List[str]],
    links: List[List[str]],
    pdnLinks: List[str],
) -> Dict[str, List[float]]:
    """
    Returns dict with:
      - 'per_ue': list of best-path reliabilities for each UE
      - 'best':  max over per_ue
      - 'worst': min over per_ue
      - 'average': avg over per_ue
    """
    # 1) Uniform UE distribution to gNBs
    base, extra = divmod(nbUE, nbgNB)
    ues_per_gnb = [base + (1 if i < extra else 0) for i in range(nbgNB)]

    # 2) Build graph of UPFs (0..nbUPF-1) plus PDN node at index nbUPF
    N = nbUPF + 1
    PDN = nbUPF
    adj = [[] for _ in range(N)]

    # 2a) gNB→UPF edges: handled per-UE below

    # 2b) UPF↔UPF edges
    for i in range(nbUPF):
        for j in range(nbUPF):
            if links[i][j] != "":
                r = link_reliability(links[i][j])
                if r > 0:
                    w = -math.log(r + EPS)
                    adj[i].append((j, w))

    # 2c) UPF→PDN edges
    for i in range(nbUPF):
        if pdnLinks[i] != "":
            r = link_reliability(pdnLinks[i])
            if r > 0:
                w = -math.log(r + EPS)
                adj[i].append((PDN, w))

    # 3) Dijkstra for reliability: shortest path from each UPF to PDN
    def dijkstra(source: int) -> List[float]:
        dist = [math.inf] * N
        dist[source] = 0.0
        heap = [(0.0, source)]
        while heap:
            cd, u = heapq.heappop(heap)
            if cd > dist[u]:
                continue
            for v, w in adj[u]:
                nd = cd + w
                if nd < dist[v]:
                    dist[v] = nd
                    heapq.heappush(heap, (nd, v))
        return dist

    upf_to_pdn = [dijkstra(i)[PDN] for i in range(nbUPF)]

    # 4) For each UE: find its gNB j, then the best (max-R) UPF path
    per_ue = []
    for j in range(nbgNB):
        for _ in range(ues_per_gnb[j]):
            best_rel = 0.0
            for i in range(nbUPF):
                if distances[j][i] != "":
                    # gNB→UPF reliability
                    r1 = link_reliability(distances[j][i])
                    # UPF→PDN reliability via best path
                    if upf_to_pdn[i] < math.inf:
                        r2 = math.exp(-upf_to_pdn[i])
                        # end-to-end reliability
                        rel = r1 * r2
                        best_rel = max(best_rel, rel)
            per_ue.append(best_rel)

    # 5) Aggregate
    if per_ue:
        return {
            "per_ue": per_ue,
            "best": max(per_ue),
            "worst": min(per_ue),
            "average": sum(per_ue) / len(per_ue),
        }
    else:
        return {"per_ue": [], "best": 0.0, "worst": 0.0, "average": 0.0}


def render_and_deploy(nbUPF, nbgNB, nbUE, distances, links):
    # ... existing code unchanged
    workdir = tempfile.mkdtemp(prefix="free5gc_run_")
    shutil.copytree("free5gc-compose", os.path.join(workdir, "free5gc-compose"))
    upf_ips = [f"60.60.0.{10 + i}" for i in range(nbUPF)]
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("docker-compose.yml.j2")
    rendered = template.render(
        nbUPF=nbUPF,
        nbgNB=nbgNB,
        nbUE=nbUE,
        distances=distances,
        links=links,
        upf_ips=upf_ips,
    )
    with open(os.path.join(workdir, "docker-compose.yml"), "w") as f:
        f.write(rendered)
    subprocess.check_call(
        [
            "docker-compose",
            "-f",
            os.path.join(workdir, "docker-compose.yml"),
            "up",
            "-d",
        ],
        cwd=workdir,
    )
    return workdir


@app.route("/")
def index():
    return "<h1>Backend is running</h1>"


@app.route("/api/topology", methods=["POST"])
def topology():
    data = request.get_json(force=True)

    nbUE = data.get("nbUE")
    nbUPF = data.get("nbUPF")
    nbgNB = data.get("nbgNB")
    distances = data.get("distances", [])  # matrix gNB x UPF
    links = data.get("links", [])  # matrix UPF x UPF
    pdnLinks = data.get("pdnLinks", [])

    # 1) Deploy free5gc-compose
    # try:
    #    run_dir = render_and_deploy(nbUPF, nbgNB, nbUE, distances, links)
    # except Exception as e:
    #    return jsonify({"error": str(e)}), 500

    # 2) Compute detailed metrics
    # If UEs are uniformly divided, build a list per gNB
    # per = [nbUE // nbgNB + (1 if i < (nbUE % nbgNB) else 0) for i in range(nbgNB)]
    # distances = [
    #    [float(value) if value.strip() else None for value in row] for row in distances
    # ]

    latency_metrics = compute_latencies_to_pdn(
        nbgNB, nbUPF, nbUE, distances, links, pdnLinks
    )

    reliability_metrics = compute_reliabilities_to_pdn(
        nbgNB, nbUPF, nbUE, distances, links, pdnLinks
    )

    metrics = {
        "worst_latency": max(latency_metrics),
        "best_latency": min(latency_metrics),
        "average_latency": (
            sum(latency_metrics) / len(latency_metrics) if latency_metrics else 0
        ),
        "worst_reliability": max(latency_metrics),
        "best_reliability": min(latency_metrics),
        "average_reliability": (
            sum(latency_metrics) / len(latency_metrics) if latency_metrics else 0
        ),
    }
    print(reliability_metrics)
    # 3) Return
    return jsonify({**metrics})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
