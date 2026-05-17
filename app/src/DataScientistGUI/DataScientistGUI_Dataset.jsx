import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DataScientistGUI_Dataset.css";
import DataScientistGUI_describe from "./DataScientistGUI_describe.json";
import evaluationData from "../../../backend/src/CNN/classification_report.json";
import { saveLogs } from "../utils/savelog";
import { getSystemVersion } from "../utils/get_system_version";
import { useTraining } from "./TrainingContext";
import { fetchDatasetConfig, saveDatasetConfig, resetDatasetConfig, DEFAULT_DATASET_PATH } from "./dataset_handle";
import classDistributionData from "../../../backend/src/CNN/class_distribution.json";

const summaryCards = evaluationData.summaryCards;

// Colors for the chart bars
const chartColors = ["#4f83ff", "#8b5cf6", "#ec4899", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#84cc16", "#f43f5e", "#14b8a6", "#a855f7", "#22c55e", "#eab308", "#ef4444", "#3b82f6", "#d946ef", "#0ea5e9", "#f472b6", "#facc15"];

// Get top 20 classes from class_distribution.json
const classDistribution = classDistributionData.top_20_classes.slice(0, 20).map((item, index) => ({
  label: item.class_name.length > 15 ? item.class_name.substring(0, 15) + "..." : item.class_name,
  value: item.num_samples,
  color: chartColors[index % chartColors.length],
}));

const datasetSpecs = [
  { label: "Train/Validation Split", value: "80% / 20%" },
  { label: "Preprocessing", value: "Resize 32×32, Normalize" },
  { label: "Imbalanced Classes", value: "Have (10x ratio)" },
  { label: "Augmentation", value: "Rotation, Zoom, Shift" },
  { label: "Color Space", value: "RGB" },
  { label: "Label Format", value: `One-hot (${classDistributionData.total_classes} classes)` },
];

// Action buttons are now handled dynamically in the component

const DataScientistGUI_Dataset = () => {
  const navItems = "menu_Dataset";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "Data Scientist";

  {/* get system version from backend and display it */}
  const [systemVersion, setSystemVersion] = useState(null);

  {/* Use training context for global state management */}
  const { trainingProgress, trainingStatus, trainingMessage } = useTraining();

  {/* Dataset configuration state */}
  const [datasetPath, setDatasetPath] = useState(DEFAULT_DATASET_PATH);
  const [absolutePath, setAbsolutePath] = useState("");
  const [isDefaultDataset, setIsDefaultDataset] = useState(true);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetMessage, setDatasetMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ver = await getSystemVersion();
      if (!mounted || ver === null || ver === undefined) return;
      setSystemVersion(ver);
    })();
    return () => { mounted = false; };
  }, []);

  {/* Load dataset configuration on mount */}
  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await fetchDatasetConfig();
      if (!mounted) return;
      if (result.success && result.data) {
        setDatasetPath(result.data.data_dir || DEFAULT_DATASET_PATH);
        setAbsolutePath(result.data.absolute_path || "");
        setIsDefaultDataset(result.data.is_default ?? true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  {/* Handle Upload Dataset button click - using File System Access API */}
  const handleUploadDataset = async () => {
    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        setDatasetLoading(true);
        setDatasetMessage("Selecting folder...");
        
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read',
        });
        
        // Get the folder name and construct relative path
        const folderName = dirHandle.name;
        const relativePath = `../../dataset/${folderName}`;
        
        setDatasetMessage("Saving dataset path...");
        const result = await saveDatasetConfig(relativePath, false, folderName);
        if (result.success) {
          setDatasetPath(relativePath);
          setAbsolutePath(result.data?.absolute_path || "");
          setIsDefaultDataset(false);
          setDatasetMessage(`Dataset selected: ${folderName}`);
        } else {
          setDatasetMessage("Failed to save dataset path.");
        }
      } else {
        // Fallback for browsers that don't support showDirectoryPicker
        const newPath = prompt("Enter the dataset folder name:", "Data");
        if (newPath && newPath.trim() !== "") {
          setDatasetLoading(true);
          setDatasetMessage("Saving dataset path...");
          const folderName = newPath.trim();
          const relativePath = `../../dataset/${folderName}`;
          const result = await saveDatasetConfig(relativePath, false, folderName);
          if (result.success) {
            setDatasetPath(relativePath);
            setAbsolutePath(result.data?.absolute_path || "");
            setIsDefaultDataset(false);
            setDatasetMessage("Dataset path saved successfully!");
          } else {
            setDatasetMessage("Failed to save dataset path.");
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setDatasetMessage("Folder selection cancelled.");
      } else {
        setDatasetMessage("Error: " + error.message);
      }
    } finally {
      setDatasetLoading(false);
      setTimeout(() => setDatasetMessage(""), 3000);
    }
  };

  {/* Handle Default Dataset button click */}
  const handleDefaultDataset = async () => {
    setDatasetLoading(true);
    setDatasetMessage("Resetting to default dataset...");
    try {
      const result = await resetDatasetConfig();
      if (result.success) {
        setDatasetPath(DEFAULT_DATASET_PATH);
        setAbsolutePath(result.data?.absolute_path || "");
        setIsDefaultDataset(true);
        setDatasetMessage("Reset to default dataset path!");
      } else {
        setDatasetMessage("Failed to reset dataset path.");
      }
    } catch (error) {
      setDatasetMessage("Error: " + error.message);
    } finally {
      setDatasetLoading(false);
      setTimeout(() => setDatasetMessage(""), 3000);
    }
  };

  {/* items selected in navigation menu, default is "menu_Archive" */}
  const navigate = useNavigate();
  const onNavItemClick = (item) => {
    if (item === "menu_History") {
      navigate("/DataScientistGUI_history", "_blank");
    } else if (item === "menu_Evaluation") {
      navigate("/DataScientistGUI_evaluation", "_blank");
    } else if (item === "menu_trainpipeline") {
      navigate("/DataScientistGUI_TrainPipeline", "_blank");
    } else if (item === "menu_Dataset") {
      /* Do nothing */
    } else {
      /* Do nothing */
    }
  };

  return (
    <div className="CommonGUI_Frame">
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <div className="header-tags">
            <span className="tag tag-green">
              <span className="dot dot-green"></span> {DataScientistGUI_describe.header.Title}
            </span>
            <span className="tag tag-orange">
              <span className="dot dot-orange"></span>{" "}
              {systemVersion ? `Version: ${systemVersion}` : "Loading version..."}
            </span>
          </div>
          <h1 className="dashboard-title">{DataScientistGUI_describe.DashboardTitle.MainTitle}</h1>
          <p className="dashboard-subtitle">{DataScientistGUI_describe.DashboardTitle.SubTitle}</p>
        </header>

        <div className="dashboard-main">
          <aside className="sidebar">
            <div className="user-profile">
              <span className="welcome-text">WELCOME!</span>
              <h2 className="user-name">{email_name}</h2>
              <span className="user-role">{DataScientistGUI_describe.role}</span>
            </div>

            <nav className="nav-menu">
              <button className="nav-item" onClick={() => onNavItemClick("menu_History")}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_History}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_Evaluation")}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_Evaluation}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_trainpipeline")}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_trainpipeline}</span>
              </button>
              <button className={`nav-item ${navItems === "menu_Dataset" ? "active" : ""}`}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_Dataset}</span>
              </button>
            </nav>
          </aside>

          <div className="ds-area history-dashboard">
            <div className="ds-dashboard">
              <section className="model-top-metrics">
                {summaryCards.map((card) => (
                  <article key={card.title} className={`model-metric-card ${card.className}`}>
                    <h2 className="model-metric-title">{card.title}</h2>
                    <p className="model-metric-value">{card.value}</p>
                    <p className="model-metric-subtitle">{card.subtitle}</p>
                    <span className="model-metric-icon" aria-hidden="true">
                      {card.icon}
                    </span>
                  </article>
                ))}
              </section>

              <section className="ds-panel">
                <div className="ds-panel-shell">
                  <div className="cnn-panel-grid">
                    <div className="cnn-panel-left">
                      <h2 className="cnn-panel-title">Class Distribution (Top 20)</h2>
                      <div className="class-chart-frame class-chart-frame-large">
                        <svg className="class-chart-svg" viewBox="0 0 560 480" preserveAspectRatio="none">
                          {(() => {
                            const maxValue = Math.max(...classDistribution.map(item => item.value));
                            const chartMax = Math.ceil(maxValue / 1000) * 1000; // Round up to nearest 1000
                            const ticks = [0, chartMax * 0.25, chartMax * 0.5, chartMax * 0.75, chartMax];
                            return (
                              <>
                                {classDistribution.map((item, index) => {
                                  const y = 16 + index * 22;
                                  const barWidth = Math.max(20, (item.value / chartMax) * 360);
                                  return (
                                    <g key={item.label + index}>
                                      <text x="16" y={y + 12} className="class-chart-label">
                                        {item.label}
                                      </text>
                                      <rect x="120" y={y} width="360" height="14" fill="#eef2ff" rx="4" />
                                      <rect x="120" y={y} width={barWidth} height="14" fill={item.color} rx="4" />
                                    </g>
                                  );
                                })}
                                <line x1="120" y1="456" x2="480" y2="456" stroke="#cbd5e1" />
                                {ticks.map((tick) => {
                                  const x = 120 + (tick / chartMax) * 360;
                                  return (
                                    <g key={tick}>
                                      <line x1={x} y1="456" x2={x} y2="462" stroke="#cbd5e1" />
                                      <text x={x} y="476" textAnchor="middle" className="class-chart-tick">
                                        {Math.round(tick)}
                                      </text>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>

                    <div className="cnn-panel-right">
                      <h2 className="cnn-panel-title">Dataset Information GTSRB</h2>
                      <div className="dataset-info-banner">
                        <strong>German Traffic Sign Recognition Benchmark</strong>
                        <p>
                          A benchmark dataset with over 50,000 real-world photos taken from cars on the road in
                          Germany. Various resolutions available.
                        </p>
                      </div>

                      <div className="dataset-spec-grid">
                        {datasetSpecs.map((item) => (
                          <article className="dataset-spec-card" key={item.label}>
                            <span className="dataset-spec-label">{item.label}</span>
                            <strong className="dataset-spec-value">{item.value}</strong>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="cnn-actions">
                    {!isDefaultDataset && absolutePath && (
                      <div className="dataset-path-info">
                        <span className="dataset-path-label">Current Dataset Path:</span>
                        <code className="dataset-path-value">{absolutePath}</code>
                      </div>
                    )}
                    {datasetMessage && <div className="dataset-message">{datasetMessage}</div>}
                    <div className="dataset-buttons">
                      <button 
                        type="button" 
                        className="cnn-action-btn secondary"
                        onClick={handleUploadDataset}
                        disabled={datasetLoading}
                      >
                        {datasetLoading ? "Processing..." : "Upload Dataset"}
                      </button>
                      <button 
                        type="button" 
                        className="cnn-action-btn ghost"
                        onClick={handleDefaultDataset}
                        disabled={datasetLoading || isDefaultDataset}
                      >
                        Default Dataset
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="ds-footer">
                <div className="ds-footer-title">
                  <strong>
                    {trainingStatus === "running" ? "Model CNN Training..." : 
                     trainingStatus === "completed" ? "Training Completed" :
                     trainingStatus === "error" ? "Training Error" : "Model CNN v2.2"}
                  </strong>
                  <span>
                    {trainingMessage || (trainingStatus === "idle" ? "Ready to train" : "")}
                  </span>
                </div>

                <div className="ds-progress-block">
                  <div className="ds-progress-copy">
                    <span>Progress: {trainingProgress}%</span>
                  </div>
                  <div className="ds-progress-track" aria-hidden="true">
                    <div className="ds-progress-fill" style={{ width: `${trainingProgress}%` }} />
                  </div>
                  <div className="ds-progress-eta">
                    {trainingStatus === "running" ? "Training in progress..." : 
                     trainingStatus === "completed" ? "Done!" : 
                     trainingStatus === "error" ? "Failed" : "Waiting"}
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataScientistGUI_Dataset;
