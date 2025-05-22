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
PROCESS_GNB = 0.0001  # fixed processing (s) at gNB before queue :contentReference[oaicite:4]{index=4}
L_BITS = 32 * 8  # packet size in bits
EPS = 1e-12  # to avoid log(0)

FREQ_MHZ = 3500  # Carrier freq (MHz)
BANDWIDTH = 100e6  # Hz
NOISE_FIG = 9  # dB
PTX_DBM = 23  # dBm
GT_DB = 8  # dBi
GR_DB = 8  # dBi
KB = 1.38064852e-23  # Boltzmann constant
TEMP = 290  # Kelvin


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


def db_to_lin(db: float) -> float:
    return 10 ** (db / 10)


def fspl_lin(d_m: float) -> float:
    """Linear FSPL from d (m) at FREQ_MHZ."""
    d_km = d_m / 1000.0
    fspl_db = (
        20 * math.log10(d_km) + 20 * math.log10(FREQ_MHZ) + 32.44
    )  # :contentReference[oaicite:0]{index=0}
    return db_to_lin(fspl_db)


def noise_power() -> float:
    """Thermal noise (W) over BANDWIDTH with NOISE_FIG."""
    noise_w = KB * TEMP * BANDWIDTH
    return noise_w * db_to_lin(NOISE_FIG)


def link_reliability(d_str: str) -> float:
    """Returns per-link reliability (0–1) for distance string d_str."""
    try:
        d = float(d_str)
    except:
        return 0.0
    pl = fspl_lin(d)
    ptx_w = 10 ** ((PTX_DBM - 30) / 10)
    snr = (ptx_w * db_to_lin(GT_DB) * db_to_lin(GR_DB) / pl) / noise_power()
    ber = math.erfc(math.sqrt(2 * snr))  # :contentReference[oaicite:1]{index=1}
    return (1 - ber) ** L_BITS  # :contentReference[oaicite:2]{index=2}


def compute_urlcc_reliability(
    N_upf: int,
    N_gnb: int,
    N_ue: int,
    distances: List[List[str]],
    links: List[List[str]],
    pdnLinks: List[str],
) -> Dict[str, float]:
    """
    Returns {'worst':%, 'best':%, 'average':%} reliability across all UEs,
    accounting for UPF backup diversity.
    """
    # 1) Uniform UE distribution
    base, extra = divmod(N_ue, N_gnb)
    ues_per_gnb = [base + (1 if i < extra else 0) for i in range(N_gnb)]

    # 2) Build log-space graph for UPF->PDN
    PDN = N_upf
    N = N_upf + 1
    adj = [[] for _ in range(N)]

    # 2a) UPF↔UPF (triangular matrix)
    for i in range(N_upf):
        for j in range(i + 1, N_upf):
            dstr = links[i][j]
            if dstr:
                r = link_reliability(dstr)
                if r > EPS:
                    w = -math.log(r)
                    adj[i].append((j, w))
                    adj[j].append((i, w))

    # 2b) UPF→PDN
    for i in range(N_upf):
        dstr = pdnLinks[i] if i < len(pdnLinks) else ""
        if dstr:
            r = link_reliability(dstr)
            if r > EPS:
                adj[i].append((PDN, -math.log(r)))

    # 3) Dijkstra on log-space
    def dijkstra(src: int) -> List[float]:
        dist = [math.inf] * N
        dist[src] = 0.0
        heap = [(0.0, src)]
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

    upf2pdn = [dijkstra(i)[PDN] for i in range(N_upf)]

    # 4) Per-UE: combine all UPF paths in parallel
    per_ue = []
    for j in range(N_gnb):
        for _ in range(ues_per_gnb[j]):
            path_rels = []
            for i in range(N_upf):
                dstr = distances[j][i]
                if dstr:
                    r1 = link_reliability(dstr)  # gNB→UPF
                    if upf2pdn[i] < math.inf:
                        r2 = math.exp(-upf2pdn[i])  # UPF→PDN
                        path_rels.append(r1 * r2)
            # combine in parallel: 1 - ∏(1 - R_i)
            if path_rels:
                prod_fail = 1.0
                for r in path_rels:
                    prod_fail *= 1 - r
                overall = 1 - prod_fail
            else:
                overall = 0.0
            per_ue.append(overall * 100)  # to percent

    if not per_ue:
        return {"worst": 0.0, "best": 0.0, "average": 0.0}

    return {
        "worst": min(per_ue),
        "best": max(per_ue),
        "average": sum(per_ue) / len(per_ue),
    }


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

    reliability_metrics = compute_urlcc_reliability(
        nbUPF, nbgNB, nbUE, distances, links, pdnLinks
    )

    metrics = {
        "worst_latency": max(latency_metrics),
        "best_latency": min(latency_metrics),
        "average_latency": (
            sum(latency_metrics) / len(latency_metrics) if latency_metrics else 0
        ),
        "best_reliability": reliability_metrics["best"],
        "worst_reliability": reliability_metrics["worst"],
        "average_reliability": reliability_metrics["average"],
    }
    # 3) Return
    return jsonify(metrics)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
