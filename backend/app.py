import os
import shutil
import tempfile
import subprocess
from flask import Flask, request, jsonify
from jinja2 import Environment, FileSystemLoader
from math import erf, sqrt
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React

# Constants for latency/reliability
C_PROP = 2e8  # propagation speed in fiber (m/s)
TP_UE = 10  # packet generation rate per UE (packets/s), adjust as needed
MU_GNB = 1000  # gNB service rate (packets/s), adjust per configuration
PROCESS_GNB = 0.001  # fixed processing time at gNB (s)
L_BITS = 32 * 8  # 32-byte packets → 256 bits


def qfunc(x):
    return 0.5 * (1 - erf(x / sqrt(2)))


def compute_metrics(distances, nbUE):
    """
    distances: list of lists [[d_j0, d_j1, ...], ...] with empty strings for no link.
    nbUE: number of UEs per gNB (or list per gNB)

    Returns dict with best/worst/avg latency & reliability.
    """
    latencies = []
    reliabilities = []

    # transport-network propagation + gNB queueing
    for j, row in enumerate(distances):
        # determine UE load on this gNB
        ue_count = nbUE[j] if isinstance(nbUE, list) else nbUE
        # arrival rate lambda_gnb
        lam = ue_count * TP_UE
        # service margin
        mu_minus_lambda = MU_GNB - lam
        for d_str in row:
            try:
                d = float(d_str)
            except (ValueError, TypeError):
                continue
            # 1) transport prop delay
            t_prop = d / C_PROP
            # 2) queueing delay at gNB (M/M/1)
            t_queue = PROCESS_GNB + (
                1.0 / mu_minus_lambda if mu_minus_lambda > 0 else float("inf")
            )
            total_lat = t_prop + t_queue
            latencies.append(total_lat)

            # reliability: BPSK AWGN on fiber link
            snr = 1.0 / (d**2 + 1e-9)
            ber = qfunc(sqrt(2 * snr))
            # consider queue drop negligible; reliability = (1-BER)^L
            rel = (1 - ber) ** L_BITS
            reliabilities.append(rel)

    if not latencies:
        return {
            "best_latency": 0,
            "worst_latency": 0,
            "average_latency": 0,
            "best_reliability": 0,
            "worst_reliability": 0,
            "average_reliability": 0,
        }

    return {
        "best_latency": min(latencies),
        "worst_latency": max(latencies),
        "average_latency": sum(latencies) / len(latencies),
        "best_reliability": max(reliabilities),
        "worst_reliability": min(reliabilities),
        "average_reliability": sum(reliabilities) / len(reliabilities),
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

    # 1) Deploy free5gc-compose
    # try:
    #    run_dir = render_and_deploy(nbUPF, nbgNB, nbUE, distances, links)
    # except Exception as e:
    #    return jsonify({"error": str(e)}), 500

    # 2) Compute detailed metrics
    # If UEs are uniformly divided, build a list per gNB
    per = [nbUE // nbgNB + (1 if i < (nbUE % nbgNB) else 0) for i in range(nbgNB)]
    metrics = compute_metrics(distances, per)

    # 3) Return
    return jsonify({**metrics})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
