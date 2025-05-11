## Table of Contents

* [Project Overview](#project-overview)
* [Key Features](#key-features)
* [Architecture](#architecture)
* [Installation](#installation)
* [Usage](#usage)
* [Configuration](#configuration)
* [Extending & Customization](#extending--customization)
* [Performance Models](#performance-models)
* [Contributing](#contributing)
* [License](#license)
* [References](#references)

---

## Project Overview

**ShellSimulate** is an integrated emulator + simulator for private 5G URLLC networks.  It lets you **spin up arbitrary topologies**—defining numbers of UPFs, gNBs, UEs, and inter-node distances—via a **free5GC-compose** backend, while **analytically estimating** end-to-end latency and reliability based on URLLC models.

By colocating UPFs at different network “edges,” you can explore latency budgets (≤ 1 ms) and “five-9s” reliability (99.999 %) targets under varying UE loads, distances, and redundancy schemes.

---

## Key Features

1. **Topology Designer UI**

   * Web-based React interface built with **react-three-fiber**, enabling drag-and-drop placement of UPFs, gNBs, and UEs in 3D
   * Live editing of distance matrices (gNB↔UPF, UPF↔UPF, DN↔UPF) and UE distribution.

2. **Automated 5G Emulation**

   * Generates Jinja2-templated `docker-compose.yml` for **free5gc-compose** to instantiate NFs (AMF/SMF/UPF) and optional UERANSIM containers
   * One-click deployment and teardown of your private 5G core network.

3. **URLLC Performance Simulation**

   * **Latency**: combines **propagation delays** $d/v$ in fiber (v≈2×10⁸ m/s) plus **M/M/1 queueing** at gNBs to model scheduling delays
   * **Reliability**: uses BPSK **BER** via Q-function and packet-success $(1-\text{BER})^L$ to estimate link and end-to-end success probabilities

4. **Metric Aggregation**

   * Computes **best**, **worst**, and **average** latency (s) and reliability (0–1) across all links or per-gNB aggregates.
   * Returns metrics via Flask JSON API for frontend visualization.

5. **Real-time Updates**

   * Topology changes (node counts, distances, links) immediately re-render the 3D scene and re-compute metrics.

---

## Architecture

```text
┌──────────────────────┐        ┌──────────────┐       ┌─────────┐
│  React Frontend      │ ↔ REST │  Flask API   │ ↔ CLI │ free5gc-│
│  (Topology3D, UI)    │        │ (Jinja2,     │       │ compose │
│  (@react-three/fiber)│        │  metrics)    │       │ emoted  │
└──────────────────────┘        └──────────────┘       └─────────┘
```

* **Frontend**

  * **React** for UI state, forms, and 3D visualization with **@react-three/fiber** and **drei** helpers 
* **Backend**

  * **Flask** REST service with **CORS** and **Jinja2** for templating `docker-compose.yml` 
  * **Metrics** module implements URLLC analytical equations.
* **Emulation**

  * **free5GC-compose**, a Docker Compose variant of free5GC core network (AMF/SMF/UPF) 
  * Optional UERANSIM integration for RAN/UE simulation.

---

## Installation

1. **Prerequisites**

   * **Docker Engine** & **Docker Compose v2**. 
   * **Node.js** + **npm** (≥ 18.x).
   * **Python 3.9+**, **pip**.

2. **Clone Repository**

   ```bash
   git clone https://github.com/your-org/shell-simulate.git
   cd shell-simulate
   ```

3. **Backend Setup**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install react react-dom @react-three/fiber @react-three/drei axios
   ```

5. **free5gc-compose**

   ```bash
   # alongside your project directory
   git clone https://github.com/free5gc/free5gc-compose.git
   ```

---

## Usage

1. **Start Backend**

   ```bash
   cd backend
   python app.py
   ```

2. **Start Frontend**

   ```bash
   cd frontend
   npm start
   ```

3. **Access UI**
   Open `http://localhost:3000`, design your topology, then click **Submit**.

4. **View Metrics**
   Best/Worst/Average latency (s) and reliability (0–1) appear overlaid; convert to ms or % for reporting.

5. **Inspect Containers**
   Each run creates a temp workdir under `/tmp/free5gc_run_*` with its own `docker-compose.yml` and logs.

---

## Configuration

* **Templates**

  * Edit `templates/docker-compose.yml.j2` to adjust NF images, commands, or network subnets.

* **System Parameters**

  * In `backend/app.py`, tune `V_FIBER`, `MU_GNB`, `LAMBDA_P`, and packet size `L_BITS` to match your desired URLLC profile.

---

## Extending & Customization

* **Add gNB Emulation**

  * Integrate **UERANSIM** or **srsRAN** containers in your Jinja2 templates for realistic RAN/UE traffic ([GitHub][5]).
* **Advanced Queueing**

  * Replace M/M/1 with M/D/1 or G/G/1 models by extending the `compute_metrics` function.
* **Topology Persistence**

  * Store topologies in a database (e.g., SQLite) and load presets in the UI.

---

## Performance Models

1. **Propagation Delay**

   $$
     t^{\rm prop}_{ij} = \frac{d_{ij}}{v}, 
     \quad v \approx 2\times10^8\;\mathrm{m/s}
   \] :contentReference[oaicite:11]{index=11}

   $$

2. **Queueing Delay**

   $$
     t^{\rm queue}_j = \frac{1}{\mu - N_{\rm UE}\lambda_p}
   $$

   where $\lambda_p$ is per-UE packet rate and $\mu$ the gNB’s service rate ([5G Americas][2]).

3. **Link Latency**

   $$
     t_{ij} = t^{\rm prop}_{ij} + t^{\rm queue}_j
   $$

4. **BER & Reliability**

   $$
     \mathrm{BER}_{ij} = Q\bigl(\sqrt{2\,/\,d_{ij}^2}\bigr), 
     \quad R_{ij} = \bigl(1-\mathrm{BER}_{ij}\bigr)^L
   \] :contentReference[oaicite:13]{index=13}

   $$

5. **Aggregate Metrics**
   Best/Worst/Average extracted over all $t_{ij}$ and $R_{ij}$.

---

## Contributing

We welcome contributions:

1. Fork & clone the repo.
2. Create a feature branch.
3. Submit a pull request with clear descriptions and tests.

Please adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guide](./CONTRIBUTING.md).

---

## License

Released under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## References

1. free5GC Compose—Docker-Compose for free5GC (Stage 3) ([free5gc.org][1])
2. 5G Americas White Paper on URLLC targets (1 ms, 99.999%) ([5G Americas][3], [5G Americas][2])
3. 3GPP TS 22.261: Service Requirements for the 5G System ([5G Americas][6])
4. Coll-Perales et al., V2X URLLC transport delay models ([arXiv][11])
5. BPSK BER Q-function in AWGN channels ([5G Americas][6])
6. React-three-fiber: React renderer for Three.js ([GitHub][8])
7. @react-three/drei helper library for Three-fiber ([Poimandres Documentation][9])
8. Flask (Pallets Projects) for Python web APIs ([The Fast Mode][10])
9. Jinja2 Templating Engine (Official docs) ([The Fast Mode][10])
10. Docker Compose documentation (Docker Inc.) ([free5gc.org][1])
11. UERANSIM integration notes (free5gc-compose) ([GitHub][5])
12. MM1 Queueing theory for URLLC delays ([5G Americas][2])
13. “On the Ultra-Reliable and Low-Latency Communications in Flexible TDD” (Esswie & Pedersen) ([arXiv][11])
14. Keysight URLLC white paper (autonomous vehicles, V2X) ([Keysight][12])
15. srsRAN & UERANSIM examples for RAN testing ([GitHub][5])

[1]: https://free5gc.org/guide/0-compose/?utm_source=chatgpt.com "0 compose - free5GC"
[2]: https://www.5gamericas.org/new-services-applications-with-5g-ultra-reliable-low-latency-communications/?utm_source=chatgpt.com "New Services & Applications with 5G Ultra-Reliable Low Latency ..."
[3]: https://www.5gamericas.org/wp-content/uploads/2019/07/5G_Americas_URLLLC_White_Paper_Final__updateJW.pdf?utm_source=chatgpt.com "[PDF] Ultra-Reliable Low-Latency Communication - 5G Americas"
[4]: https://docs.pmnd.rs/react-three-fiber?ref=trap.jp&utm_source=chatgpt.com "Introduction - React Three Fiber - Docs"
[5]: https://github.com/free5gc/free5gc-compose?utm_source=chatgpt.com "free5GC compose - GitHub"
[6]: https://www.5gamericas.org/white-papers/?utm_source=chatgpt.com "5G Americas white papers"
[7]: https://github.com/calee0219/free5gc-docker-compose?utm_source=chatgpt.com "calee0219/free5gc-docker-compose - GitHub"
[8]: https://github.com/pmndrs/react-three-fiber?utm_source=chatgpt.com "pmndrs/react-three-fiber: A React renderer for Three.js - GitHub"
[9]: https://drei.docs.pmnd.rs/?utm_source=chatgpt.com "Drei: Introduction"
[10]: https://www.thefastmode.com/telecom-white-papers/26949-white-paper-understanding-5g-time-critical-services?utm_source=chatgpt.com "[White paper] Understanding 5G & Time Critical Services"
[11]: https://arxiv.org/abs/1909.11305?utm_source=chatgpt.com "On the Ultra-Reliable and Low-Latency Communications in Flexible TDD/FDD 5G Networks"
[12]: https://www.keysight.com/us/en/assets/7120-1098/white-papers/URLLC-5Gs-Most-Intriguing-and-Challenging-Use-Case.pdf?utm_source=chatgpt.com "URLLC: 5G's Most Intriguing and Challenging Use Case - Keysight"
