/**
 * Training handler for CNN model training
 * Communicates with backend to start/stop training and receive progress updates
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

/**
 * Start the CNN training process
 * @returns {Promise<{message: string, status: string, websocket_url: string}>}
 */
export async function startTraining() {
  const res = await fetch(`${API_BASE_URL}/api/training/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to start training");
  }
  
  return res.json();
}

/**
 * Get current training status
 * @returns {Promise<{is_running: boolean, progress: number, status: string, message: string}>}
 */
export async function getTrainingStatus() {
  const res = await fetch(`${API_BASE_URL}/api/training/status`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    throw new Error("Failed to get training status");
  }
  
  return res.json();
}

/**
 * Stop the current training process
 * @returns {Promise<{message: string}>}
 */
export async function stopTraining() {
  const res = await fetch(`${API_BASE_URL}/api/training/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    throw new Error("Failed to stop training");
  }
  
  return res.json();
}

/**
 * Create a WebSocket connection for real-time training progress
 * @param {Object} callbacks - Callback functions for WebSocket events
 * @param {function} callbacks.onProgress - Called when progress updates are received
 * @param {function} callbacks.onComplete - Called when training completes
 * @param {function} callbacks.onError - Called when an error occurs
 * @param {function} callbacks.onClose - Called when connection closes
 * @returns {WebSocket} WebSocket instance
 */
export function connectTrainingWebSocket({ onProgress, onComplete, onError, onClose }) {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/training-progress`);
  
  ws.onopen = () => {
    console.log("Training WebSocket connected");
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Skip heartbeat messages
      if (data.heartbeat) {
        return;
      }
      
      // Call progress callback
      if (onProgress) {
        onProgress(data);
      }
      
      // Call complete callback when training finishes
      if (data.status === "completed" && onComplete) {
        onComplete(data);
      }
      
      // Call error callback if training failed
      if (data.status === "error" && onError) {
        onError(new Error(data.message));
      }
    } catch (e) {
      console.error("Error parsing training progress:", e);
    }
  };
  
  ws.onerror = (error) => {
    console.error("Training WebSocket error:", error);
    if (onError) {
      onError(error);
    }
  };
  
  ws.onclose = () => {
    console.log("Training WebSocket closed");
    if (onClose) {
      onClose();
    }
  };
  
  return ws;
}

/**
 * Disconnect training WebSocket
 * @param {WebSocket} ws - WebSocket instance to close
 */
export function disconnectTrainingWebSocket(ws) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}
