import os
import sys
import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

# Load YAML config
try:
    import yaml
    CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "training_config.yaml")
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        CONFIG = yaml.safe_load(f)
    print(f"[Training] Loaded config from {CONFIG_PATH}")
except Exception as e:
    print(f"[Training] Warning: Could not load config: {e}, using defaults")
    CONFIG = {}

# Try to import nbformat and nbclient for notebook execution
try:
    import nbformat
    from nbclient import NotebookClient
    from nbclient.exceptions import CellExecutionError
    NOTEBOOK_EXECUTION_AVAILABLE = True
except ImportError:
    NOTEBOOK_EXECUTION_AVAILABLE = False

training_router = APIRouter()

# Get config values with defaults
NOTEBOOK_PATH_CONFIG = CONFIG.get("notebook", {}).get("path", "CNN/traffic-sign-recognition-using-pytorch-and-cnn.ipynb")
CELL_TIMEOUT = CONFIG.get("notebook", {}).get("cell_timeout", 3600)
SAVE_AFTER_EXECUTION = CONFIG.get("notebook", {}).get("save_after_execution", True)
KERNEL_NAME = CONFIG.get("kernel", {}).get("name", "python3")
PYTHON_PATH = CONFIG.get("kernel", {}).get("python_path", "")
PROGRESS_INTERVAL = CONFIG.get("execution", {}).get("progress_interval", 3)
MAX_EXECUTION_TIME = CONFIG.get("execution", {}).get("max_execution_time", 7200)
VERBOSE = CONFIG.get("logging", {}).get("verbose", True)

# Path to the notebook - resolve relative to backend/src/
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/src/
if os.path.isabs(NOTEBOOK_PATH_CONFIG):
    NOTEBOOK_PATH = NOTEBOOK_PATH_CONFIG
else:
    NOTEBOOK_PATH = os.path.normpath(os.path.join(BASE_DIR, NOTEBOOK_PATH_CONFIG))

NOTEBOOK_DIR = os.path.dirname(NOTEBOOK_PATH)

# Training state management
training_state = {
    "is_running": False,
    "progress": 0,
    "status": "idle",  # idle, running, completed, error
    "message": "",
    "start_time": None,
    "end_time": None,
    "error_detail": None,
    "current_cell": 0,
    "total_cells": 0,
}

# WebSocket connections for broadcasting progress
active_connections: list[WebSocket] = []


async def broadcast_progress(data: dict):
    """Broadcast training progress to all connected WebSocket clients."""
    for connection in active_connections:
        try:
            await connection.send_json(data)
        except Exception:
            pass


async def run_notebook_training():
    """Execute the Jupyter notebook using nbclient."""
    global training_state
    
    training_state["is_running"] = True
    training_state["status"] = "running"
    training_state["progress"] = 0
    training_state["start_time"] = datetime.now().isoformat()
    training_state["message"] = "Starting training..."
    training_state["error_detail"] = None
    training_state["current_cell"] = 0
    training_state["total_cells"] = 0
    
    await broadcast_progress(training_state.copy())
    
    try:
        # Check if notebook execution is available
        if not NOTEBOOK_EXECUTION_AVAILABLE:
            raise ImportError("nbformat or nbclient not installed. Run: pip install nbformat nbclient")
        
        # Get absolute path to notebook
        notebook_abs_path = os.path.abspath(NOTEBOOK_PATH)
        notebook_dir = os.path.dirname(notebook_abs_path)
        
        print(f"[Training] Notebook path: {notebook_abs_path}")
        print(f"[Training] Notebook dir: {notebook_dir}")
        
        # Check if notebook exists
        if not os.path.exists(notebook_abs_path):
            raise FileNotFoundError(f"Notebook not found: {notebook_abs_path}")
        
        training_state["message"] = "Loading notebook..."
        training_state["progress"] = 5
        await broadcast_progress(training_state.copy())
        
        # Read the notebook
        with open(notebook_abs_path, 'r', encoding='utf-8') as f:
            nb = nbformat.read(f, as_version=4)
        
        # Count code cells
        code_cells = [cell for cell in nb.cells if cell.cell_type == 'code']
        total_code_cells = len(code_cells)
        training_state["total_cells"] = total_code_cells
        
        training_state["message"] = f"Found {total_code_cells} code cells to execute..."
        training_state["progress"] = 10
        await broadcast_progress(training_state.copy())
        
        # Create notebook client with config values
        if VERBOSE:
            print(f"[Training] Using kernel: {KERNEL_NAME}")
            print(f"[Training] Cell timeout: {CELL_TIMEOUT}s")
        
        client = NotebookClient(
            nb,
            timeout=CELL_TIMEOUT,
            kernel_name=KERNEL_NAME,
            resources={'metadata': {'path': notebook_dir}}
        )
        
        # Execute notebook - run in thread pool to not block
        def execute_notebook():
            # Change to notebook directory for relative imports
            original_dir = os.getcwd()
            os.chdir(notebook_dir)
            try:
                client.execute()
                return None  # Success
            except CellExecutionError as e:
                return str(e)
            finally:
                os.chdir(original_dir)
        
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        
        # Start execution in background
        import concurrent.futures
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = loop.run_in_executor(executor, execute_notebook)
        
        # Update progress while executing
        progress_step = 80 / max(total_code_cells, 1)  # 10% to 90%
        current_progress = 10
        
        while not future.done():
            await asyncio.sleep(PROGRESS_INTERVAL)
            if current_progress < 90:
                current_progress = min(90, current_progress + 5)
                training_state["progress"] = int(current_progress)
                training_state["message"] = f"Executing notebook... {int(current_progress)}%"
                await broadcast_progress(training_state.copy())
        
        # Get result
        error = await future
        
        if error is None:
            # Save the executed notebook if configured
            if SAVE_AFTER_EXECUTION:
                with open(notebook_abs_path, 'w', encoding='utf-8') as f:
                    nbformat.write(nb, f)
                if VERBOSE:
                    print(f"[Training] Saved notebook to {notebook_abs_path}")
            
            training_state["status"] = "completed"
            training_state["progress"] = 100
            training_state["message"] = "Training completed successfully!"
            training_state["end_time"] = datetime.now().isoformat()
            print("[Training] Completed successfully!")
        else:
            training_state["status"] = "error"
            training_state["message"] = "Cell execution error"
            training_state["error_detail"] = error[:500] if error else "Unknown error"
            training_state["end_time"] = datetime.now().isoformat()
            print(f"[Training] Error: {error}")
            
    except ImportError as e:
        training_state["status"] = "error"
        training_state["message"] = str(e)
        training_state["error_detail"] = "Missing dependencies: pip install nbformat nbclient"
        training_state["end_time"] = datetime.now().isoformat()
        print(f"[Training] Import error: {e}")
    except FileNotFoundError as e:
        training_state["status"] = "error"
        training_state["message"] = str(e)
        training_state["error_detail"] = str(e)
        training_state["end_time"] = datetime.now().isoformat()
        print(f"[Training] File not found: {e}")
    except Exception as e:
        training_state["status"] = "error"
        training_state["message"] = f"Error: {str(e)}"
        training_state["error_detail"] = str(e)
        training_state["end_time"] = datetime.now().isoformat()
        print(f"[Training] Exception: {e}")
    finally:
        training_state["is_running"] = False
        await broadcast_progress(training_state.copy())


@training_router.post("/api/training/start")
async def start_training():
    """Start the CNN training by executing the Jupyter notebook."""
    global training_state
    
    if training_state["is_running"]:
        return JSONResponse(
            content={"error": "Training is already in progress"},
            status_code=409
        )
    
    # Start training in background
    asyncio.create_task(run_notebook_training())
    
    return JSONResponse(
        content={
            "message": "Training started",
            "status": "running",
            "websocket_url": "/ws/training-progress"
        },
        status_code=200
    )


@training_router.get("/api/training/status")
async def get_training_status():
    """Get current training status."""
    return JSONResponse(content={
        **training_state.copy(),
        "notebook_path": os.path.abspath(NOTEBOOK_PATH),
        "notebook_exists": os.path.exists(NOTEBOOK_PATH),
        "config": {
            "kernel_name": KERNEL_NAME,
            "cell_timeout": CELL_TIMEOUT,
            "progress_interval": PROGRESS_INTERVAL,
            "save_after_execution": SAVE_AFTER_EXECUTION,
        }
    })


@training_router.post("/api/training/stop")
async def stop_training():
    """Stop the current training (if running)."""
    global training_state
    
    if not training_state["is_running"]:
        return JSONResponse(
            content={"message": "No training in progress"},
            status_code=200
        )
    
    # Set flag to stop (actual stopping depends on implementation)
    training_state["status"] = "stopped"
    training_state["message"] = "Training stopped by user"
    training_state["is_running"] = False
    training_state["end_time"] = datetime.now().isoformat()
    
    await broadcast_progress(training_state.copy())
    
    return JSONResponse(
        content={"message": "Training stop requested"},
        status_code=200
    )


@training_router.websocket("/ws/training-progress")
async def ws_training_progress(websocket: WebSocket):
    """WebSocket endpoint for real-time training progress updates."""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send current state immediately
        await websocket.send_json(training_state.copy())
        
        # Keep connection alive and listen for client messages
        while True:
            try:
                # Wait for any message from client (ping/pong or close)
                await asyncio.wait_for(websocket.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"heartbeat": True, **training_state.copy()})
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
