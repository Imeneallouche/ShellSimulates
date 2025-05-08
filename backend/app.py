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
import math
from typing import List, Dict


def calculate_metrics(num_upfs, num_gnbs, ue_per_gnb, distances, links):
    # Constants
    SPEED = 2e8  # m/s (fiber optic)
    BLER = 0.1
    N_RETRANS = 3
    T_INITIAL = 0.001  # 1 ms
    T_RETRANS = 0.001  # 1 ms per retransmission
    PROCESSING_DELAY_PER_UPF = 0.0005  # 0.5 ms

    # Radio latency (round trip)
    radio_latency = 2 * (T_INITIAL + N_RETRANS * T_RETRANS)

    # Radio reliability (round trip)
    radio_reliability_one_way = 1 - (BLER ** (N_RETRANS + 1))
    radio_reliability_round_trip = radio_reliability_one_way**2

    # Initialize metrics
    latency_worst, latency_best, latency_avg = [], [], []
    reliabilities = []
    total_ues = sum(ue_per_gnb)

    for gnb_id in range(num_gnbs):
        num_ues = ue_per_gnb[gnb_id]
        if num_ues == 0:
            continue

        # Extract connected UPFs and distances for this gNB
        connected_upfs = [
            upf_id
            for upf_id in range(num_upfs)
            if distances[gnb_id][upf_id] is not None
        ]
        if not connected_upfs:
            # No UPF connected: latency = infinity, reliability = 0
            latency_worst.extend([float("inf")] * num_ues)
            latency_best.extend([float("inf")] * num_ues)
            latency_avg.extend([float("inf")] * num_ues)
            reliabilities.extend([0.0] * num_ues)
            continue

        # Calculate latencies for each UPF path
        upf_latencies = []
        for upf_id in connected_upfs:
            distance = distances[gnb_id][upf_id]
            transport_latency = 2 * (distance / SPEED)  # Round trip
            core_latency = PROCESSING_DELAY_PER_UPF
            total_latency = radio_latency + transport_latency + core_latency
            upf_latencies.append(total_latency)

        # Latency metrics for this gNB
        gnb_worst = max(upf_latencies)
        gnb_best = min(upf_latencies)
        gnb_avg = sum(upf_latencies) / len(upf_latencies)

        latency_worst.extend([gnb_worst] * num_ues)
        latency_best.extend([gnb_best] * num_ues)
        latency_avg.extend([gnb_avg] * num_ues)

        # Reliability for this gNB
        num_upfs_connected = len(connected_upfs)
        reliability = 1 - (1 - radio_reliability_round_trip) ** num_upfs_connected
        reliabilities.extend([reliability] * num_ues)

    # Aggregate results
    def get_stats(values):
        valid = [v for v in values if v != float("inf")]
        return {
            "worst": max(valid) if valid else 0,
            "best": min(valid) if valid else 0,
            "average": sum(valid) / len(valid) if valid else 0,
        }

    latency_stats = get_stats(latency_avg)  # Use avg for overall topology
    reliability_stats = {
        "worst": min(reliabilities),
        "best": max(reliabilities),
        "average": sum(reliabilities) / len(reliabilities) if reliabilities else 0,
    }

    return {
        "best_latency": latency_stats["best"],
        "worst_latency": latency_stats["worst"],
        "average_latency": latency_stats["average"],
        "best_reliability": reliability_stats["best"],
        "worst_reliability": reliability_stats["worst"],
        "average_reliability": reliability_stats["average"],
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
    distances = [
        [float(value) if value.strip() else None for value in row] for row in distances
    ]
    metrics = calculate_metrics(nbUPF, nbgNB, per, distances, links)

    # 3) Return
    return jsonify({**metrics})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
