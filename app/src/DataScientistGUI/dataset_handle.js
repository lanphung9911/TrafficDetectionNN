import { API_BASE_URL } from "../config";

const DEFAULT_DATASET_PATH = "../../dataset/Data";

/**
 * Fetch dataset configuration from backend
 */
export const fetchDatasetConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dataset-config`, {
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
    console.error("Error fetching dataset config:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Save dataset configuration to backend
 * @param {string} dataDir - The dataset directory path
 * @param {boolean} isDefault - Whether this is the default path
 * @param {string} folderName - The folder name for display
 */
export const saveDatasetConfig = async (dataDir, isDefault = false, folderName = "") => {
  try {
    const payload = {
      data_dir: dataDir,
      is_default: isDefault,
      folder_name: folderName || dataDir.split('/').pop(),
    };

    const response = await fetch(`${API_BASE_URL}/api/dataset-config`, {
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
    console.error("Error saving dataset config:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset dataset configuration to default
 */
export const resetDatasetConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dataset-config/reset`, {
      method: "POST",
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
    console.error("Error resetting dataset config:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate dataset path
 * @param {string} dataDir - The dataset directory path to validate
 */
export const validateDatasetPath = async (dataDir) => {
  try {
    const payload = {
      data_dir: dataDir,
      is_default: false,
    };

    const response = await fetch(`${API_BASE_URL}/api/dataset-config/validate`, {
      method: "POST",
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
    console.error("Error validating dataset path:", error);
    return { success: false, valid: false, error: error.message };
  }
};

export { DEFAULT_DATASET_PATH };
