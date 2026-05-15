import { API_BASE_URL } from "../config";

/**
 * Fetch hyperparameters from backend
 */
export const fetchHyperparameters = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hyperparameters`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching hyperparameters:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Save hyperparameters to backend
 */
export const saveHyperparameters = async (hyperparameters, augmentation = null, statistics = null) => {
  try {
    const payload = {
      hyperparameters: {
        learning_rate: parseFloat(hyperparameters.learning_rate) || 0.001,
        batch_size: parseInt(hyperparameters.batch_size) || 32,
        epochs: parseInt(hyperparameters.epochs) || 50,
        optimizer: hyperparameters.optimizer || "Adam",
        loss_function: hyperparameters.loss_function || "Categorical CE",
        input_shape: hyperparameters.input_shape || "32×32×3",
      },
    };

    if (augmentation) {
      payload.augmentation = augmentation;
    }

    if (statistics) {
      payload.statistics = statistics;
    }

    const response = await fetch(`${API_BASE_URL}/api/hyperparameters`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving hyperparameters:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Convert hyperparameters object to array format for display
 */
export const hyperparamsToArray = (hyperparameters) => {
  if (!hyperparameters) return [];
  
  return [
    ["Learning Rate", String(hyperparameters.learning_rate || "0.001")],
    ["Batch Size", String(hyperparameters.batch_size || "32")],
    ["Epochs", String(hyperparameters.epochs || "50")],
    ["Optimizer", hyperparameters.optimizer || "Adam"],
    ["Loss Function", hyperparameters.loss_function || "Categorical CE"],
    ["Input Shape", hyperparameters.input_shape || "32×32×3"],
  ];
};

/**
 * Convert array format back to hyperparameters object
 */
export const arrayToHyperparams = (array) => {
  const result = {};
  const keyMapping = {
    "Learning Rate": "learning_rate",
    "Batch Size": "batch_size",
    "Epochs": "epochs",
    "Optimizer": "optimizer",
    "Loss Function": "loss_function",
    "Input Shape": "input_shape",
  };

  array.forEach(([label, value]) => {
    const key = keyMapping[label];
    if (key) {
      result[key] = value;
    }
  });

  return result;
};

/**
 * Convert augmentation object to array format for display
 */
export const augmentationToArray = (augmentation) => {
  if (!augmentation) return [];
  
  return [
    ["Rotation", augmentation.rotation || "+15°"],
    ["Width Shift", augmentation.width_shift || "10%"],
    ["Height Shift", augmentation.height_shift || "10%"],
    ["Zoom Range", augmentation.zoom_range || "20%"],
    ["Horizontal Flip", String(augmentation.horizontal_flip ?? "False")],
    ["Preprocessing", augmentation.preprocessing || "Normalize /255"],
  ];
};

/**
 * Convert statistics object to array format for display
 */
export const statisticsToArray = (statistics) => {
  if (!statistics) return [];
  
  return [
    ["Total Parameters", statistics.total_parameters || "2.3M"],
    ["Trainable Params", statistics.trainable_params || "2.3M"],
    ["Model Size", statistics.model_size || "8.9 MB"],
    ["Conv Layers", String(statistics.conv_layers || "4")],
    ["Dense Layers", String(statistics.dense_layers || "2")],
    ["Training Time", statistics.training_time || "~22 phút"],
  ];
};
