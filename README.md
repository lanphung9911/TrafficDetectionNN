### TrafficDetectionNN environment setup ###
### Version modify: 0.1 ###

### Environment setup ###
OS: windows (cmd, PowerSheel)
Node.js: version >20, store at C:/nodejs
Python: version >3.9, incuded upgraded latest of pip

### Project structure ###
/app: front end react + vite
/backend: backend fast api, websocket

### Local host ###
Default of frontend: http://localhost:8000
Default of backend server: http://localhost:5173

### Create virtual python environment ###
1. Create virtual python
    (cmd/Jupyter kernel) python -m venv .venv
2. Activate virtual python
    run bat file in \.venv\Scripts\activate.bat
3. Install necessary library
    (cmd) pip install fastapi uvicorn python-dotenv pydantic

### Set up node module in frontend
(cmd) cd app
(cmd) npm install
=> Expectation: folder app/node_modules created

### Set up client environment ###
1. Ask server https (host, port 8000)
2. Modify /scripts/client_env.yaml
    backend_host = host of server
3. run bat file store at /scripts/setup_client_env.yaml

### Set up server environment ###
1. Define PC as server then run local host
2. Start server
    (cmd) backend
    (cmd) uvicorn src.main:app --host 0.0.0.0 --port 8000

### Run trial frontend ###
    (cmd) cd app
    (cmd) C:/nodejs/npm.cmd run dev