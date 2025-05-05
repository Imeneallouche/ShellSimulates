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
C = 3e8  # speed of light (m/s)
L_BITS = 32 * 8  # 32-byte packets → 256 bits


def qfunc(x):
    return 0.5 * (1 - erf(x / sqrt(2)))


def compute_metrics(distances):
    latencies, reliabilities = [], []
    for row in distances:
        for d_str in row:
            try:
                d = float(d_str)
            except (ValueError, TypeError):
                continue
            # Propagation delay
            t_prop = d / C
            latencies.append(t_prop)
            # Simplified SNR ∝ 1/d^2
            snr = 1.0 / (d**2 + 1e-9)
            ber = qfunc((2 * snr) ** 0.5)
            rel = (1 - ber) ** L_BITS
            reliabilities.append(rel)
    if not latencies:
        return 0.0, 0.0
    return sum(latencies) / len(latencies), sum(reliabilities) / len(reliabilities)


def render_and_deploy(nbUPF, nbgNB, nbUE, distances, links):
    # 1. Prepare a temp directory
    workdir = tempfile.mkdtemp(prefix="free5gc_run_")
    # 2. Copy the entire free5gc-compose into it
    shutil.copytree("free5gc-compose", os.path.join(workdir, "free5gc-compose"))
    # 3. Compute IP lists for UPFs (example 60.60.0.x subnet)
    upf_ips = [f"60.60.0.{10 + i}" for i in range(nbUPF)]
    # 4. Render docker-compose.yml via Jinja2
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
    # 5. Launch via docker-compose
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
    data = request.get_json()

    nbUE = data.get("nbUE")
    nbUPF = data.get("nbUPF")
    nbgNB = data.get("nbgNB")
    distances = data.get("distances")  # matrix gNB x UPF
    links = data.get("links")  # matrix UPF x UPF

    print(nbgNB, nbUPF, nbUE)
    # 1) Render configs & deploy free5gc-compose
    # try:
    #    run_dir = render_and_deploy(nbUPF, nbgNB, nbUE, distances, links)
    # except Exception as e:
    #    return jsonify({"error": str(e)}), 500

    # 2) Compute average latency & reliability
    avg_lat, avg_rel = compute_metrics(distances)

    return jsonify(
        {
            "average_latency": avg_lat,
            "average_reliability": avg_rel,
            # "run_directory": run_dir,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
