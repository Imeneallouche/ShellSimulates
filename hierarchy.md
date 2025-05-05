```yaml
urllc-simulator/
├── frontend/                     # React web UI
│   ├── public/
│   └── src/
│       ├── components/          # Topology builder, forms
│       └── services/            # API calls to backend
├── backend/                      # Flask REST API + simulator logic
│   ├── app.py                   # Main Flask app
│   ├── config/                  # Templates for free5gc config files
│   ├── simulator/               # Distance-based latency/reliability models
│   └── emulator_integration/    # Wrappers to launch free5gc-compose
├── docker-compose.yaml          # Orchestrates backend, frontend, free5gc-compose :contentReference[oaicite:5]{index=5}
├── Dockerfile.backend           # Builds Flask service
├── Dockerfile.frontend          # Builds React app
├── .env                         # Environment variables (e.g. free5gc paths)
└── README.md                    # Setup instructions
```
