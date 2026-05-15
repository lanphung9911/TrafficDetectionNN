import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { 
  startTraining as apiStartTraining, 
  stopTraining as apiStopTraining, 
  getTrainingStatus,
  connectTrainingWebSocket, 
  disconnectTrainingWebSocket 
} from "./training_handle";

// Create context
const TrainingContext = createContext(null);

// Provider component
export const TrainingProvider = ({ children }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState("idle"); // idle, running, completed, error, stopped
  const [trainingMessage, setTrainingMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState(null);
  const wsRef = useRef(null);

  // Connect to WebSocket for progress updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      disconnectTrainingWebSocket(wsRef.current);
    }

    wsRef.current = connectTrainingWebSocket({
      onProgress: (data) => {
        setTrainingProgress(data.progress || 0);
        setTrainingStatus(data.status || "running");
        setTrainingMessage(data.message || "");
        setErrorDetail(data.error_detail || null);
        
        if (data.status === "completed" || data.status === "error" || data.status === "stopped") {
          setIsTraining(false);
        } else if (data.status === "running") {
          setIsTraining(true);
        }
      },
      onComplete: (data) => {
        setIsTraining(false);
        setTrainingStatus("completed");
        setTrainingMessage("Training completed successfully!");
      },
      onError: (error) => {
        setIsTraining(false);
        setTrainingStatus("error");
        setTrainingMessage(error.message || "Training failed");
      },
      onClose: () => {
        // WebSocket closed - could reconnect if still training
      },
    });
  }, []);

  // Fetch current training status from backend on mount
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getTrainingStatus();
      setTrainingProgress(status.progress || 0);
      setTrainingStatus(status.status || "idle");
      setTrainingMessage(status.message || "");
      setErrorDetail(status.error_detail || null);
      
      if (status.is_running) {
        setIsTraining(true);
        // Connect WebSocket if training is running
        connectWebSocket();
      } else {
        setIsTraining(false);
      }
    } catch (error) {
      console.error("Failed to fetch training status:", error);
    }
  }, [connectWebSocket]);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        disconnectTrainingWebSocket(wsRef.current);
      }
    };
  }, [fetchStatus]);

  // Start training
  const startTraining = async () => {
    try {
      setIsTraining(true);
      setTrainingStatus("running");
      setTrainingProgress(0);
      setTrainingMessage("Starting training...");
      setErrorDetail(null);

      await apiStartTraining();
      connectWebSocket();
      
      return { success: true };
    } catch (error) {
      setIsTraining(false);
      setTrainingStatus("error");
      setTrainingMessage(error.message || "Failed to start training");
      return { success: false, error: error.message };
    }
  };

  // Stop training
  const stopTraining = async () => {
    try {
      await apiStopTraining();
      setIsTraining(false);
      setTrainingStatus("stopped");
      setTrainingMessage("Training stopped by user");
      
      if (wsRef.current) {
        disconnectTrainingWebSocket(wsRef.current);
        wsRef.current = null;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error stopping training:", error);
      return { success: false, error: error.message };
    }
  };

  // Reset state
  const resetTrainingState = () => {
    setIsTraining(false);
    setTrainingProgress(0);
    setTrainingStatus("idle");
    setTrainingMessage("");
    setErrorDetail(null);
  };

  const value = {
    isTraining,
    trainingProgress,
    trainingStatus,
    trainingMessage,
    errorDetail,
    startTraining,
    stopTraining,
    fetchStatus,
    resetTrainingState,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
};

// Custom hook to use training context
export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error("useTraining must be used within a TrainingProvider");
  }
  return context;
};

export default TrainingContext;
