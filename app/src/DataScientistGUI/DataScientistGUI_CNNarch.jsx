import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DataScientistGUI_CNNarch.css";
import DataScientistGUI_describe from "./DataScientistGUI_describe.json";
import evaluationData from "../../../backend/src/CNN/classification_report.json";
import { saveLogs } from "../utils/savelog";
import { getSystemVersion } from "../utils/get_system_version";
import { useTraining } from "./TrainingContext";
import { 
  fetchHyperparameters, 
  saveHyperparameters, 
  hyperparamsToArray,
  arrayToHyperparams,
  augmentationToArray,
  statisticsToArray 
} from "./hyperparameters_handle";

const summaryCards = evaluationData.summaryCards;

const architectureLegend = [
  { label: "Conv2D", className: "legend-conv" },
  { label: "MaxPool", className: "legend-pool" },
  { label: "Dropout", className: "legend-dropout" },
  { label: "Dense", className: "legend-dense" },
  { label: "Output", className: "legend-output" },
];

const architectureLayers = [
  { title: "Input", subtitle: "32×32×3", className: "layer-input" },
  { title: "Conv2D", subtitle: "32 filters, 3×3, ReLU", className: "layer-conv" },
  { title: "Conv2D", subtitle: "32 filters, 3×3, ReLU", className: "layer-conv" },
  { title: "MaxPool2D", subtitle: "2×2, stride=2", className: "layer-pool" },
  { title: "Dropout", subtitle: "rate=0.25", className: "layer-dropout" },
  { title: "Conv2D", subtitle: "64 filters, 3×3, ReLU", className: "layer-conv" },
  { title: "Conv2D", subtitle: "64 filters, 3×3, ReLU", className: "layer-conv" },
  { title: "MaxPool2D", subtitle: "2×2, stride=2", className: "layer-pool" },
  { title: "Dropout", subtitle: "rate=0.25", className: "layer-dropout" },
  { title: "Dense", subtitle: "128 units, ReLU", className: "layer-dense" },
  { title: "Dense", subtitle: "64 units, ReLU", className: "layer-dense" },
  { title: "Output", subtitle: "43 classes, Softmax", className: "layer-output" },
];

// Default values (will be overridden by backend data)
const defaultHyperparameters = [
  ["Learning Rate", "0.001"],
  ["Batch Size", "32"],
  ["Epochs", "50"],
  ["Optimizer", "Adam"],
  ["Loss Function", "Categorical CE"],
  ["Input Shape", "32×32×3"],
];

const defaultAugmentation = [
  ["Rotation", "+15°"],
  ["Width Shift", "10%"],
  ["Height Shift", "10%"],
  ["Zoom Range", "20%"],
  ["Horizontal Flip", "False"],
  ["Preprocessing", "Normalize /255"],
];

const defaultStatistics = [
  ["Total Parameters", "2.3M"],
  ["Trainable Params", "2.3M"],
  ["Model Size", "8.9 MB"],
  ["Conv Layers", "4"],
  ["Dense Layers", "2"],
  ["Training Time", "~22 phút"],
];

const actionButtons = [
  { label: "Start Training", className: "primary" },
  // { label: "Upload Dataset", className: "secondary" },
  // { label: "Export Model (.h5)", className: "ghost" },
  // { label: "Show on GitHub", className: "ghost" },
];

const DataScientistGUI_CNNarch = () => {
  const navItems = "menu_CNNarch";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "Data Scientist";

  {/* get system version from backend and display it */}
  const [systemVersion, setSystemVersion] = useState(null);

  {/* State for hyperparameters, augmentation, statistics */}
  const [hyperparameters, setHyperparameters] = useState(defaultHyperparameters);
  const [augmentation, setAugmentation] = useState(defaultAugmentation);
  const [statistics, setStatistics] = useState(defaultStatistics);

  {/* State for edit mode */}
  const [isEditingHyperparams, setIsEditingHyperparams] = useState(false);
  const [editedHyperparams, setEditedHyperparams] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  {/* Use training context for global state management */}
  const { 
    isTraining, 
    trainingProgress, 
    trainingStatus, 
    trainingMessage,
    startTraining,
    stopTraining 
  } = useTraining();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ver = await getSystemVersion();
      if (!mounted || ver === null || ver === undefined) return;
      setSystemVersion(ver);
    })();
    return () => { mounted = false; };
  }, []);

  {/* Load hyperparameters from backend on mount */}
  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await fetchHyperparameters();
      if (!mounted) return;
      if (result.success && result.data) {
        const { hyperparameters: hp, augmentation: aug, statistics: stats } = result.data;
        if (hp) setHyperparameters(hyperparamsToArray(hp));
        if (aug) setAugmentation(augmentationToArray(aug));
        if (stats) setStatistics(statisticsToArray(stats));
      }
    })();
    return () => { mounted = false; };
  }, []);

  {/* Handle edit mode toggle */}
  const handleEditHyperparams = () => {
    if (!isEditingHyperparams) {
      // Enter edit mode - convert array to object for editing
      const editObj = {};
      hyperparameters.forEach(([label, value]) => {
        editObj[label] = value;
      });
      setEditedHyperparams(editObj);
    }
    setIsEditingHyperparams(!isEditingHyperparams);
    setSaveMessage("");
  };

  {/* Handle input change during editing */}
  const handleHyperparamChange = (label, value) => {
    setEditedHyperparams(prev => ({
      ...prev,
      [label]: value
    }));
  };

  {/* Handle save hyperparameters */}
  const handleSaveHyperparams = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const hyperparamsObj = arrayToHyperparams(
      Object.entries(editedHyperparams).map(([label, value]) => [label, value])
    );

    const result = await saveHyperparameters(hyperparamsObj);
    
    if (result.success) {
      // Update local state with saved values
      const newHyperparams = Object.entries(editedHyperparams).map(([label, value]) => [label, value]);
      setHyperparameters(newHyperparams);
      setIsEditingHyperparams(false);
      setSaveMessage("Saved successfully!");
    } else {
      setSaveMessage("Error saving: " + (result.error || "Unknown error"));
    }
    
    setIsSaving(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(""), 3000);
  };

  {/* Handle cancel editing */}
  const handleCancelEdit = () => {
    setIsEditingHyperparams(false);
    setEditedHyperparams({});
    setSaveMessage("");
  };

  {/* Handle training button click */}
  const handleStartTraining = async () => {
    if (isTraining) {
      // Stop training
      await stopTraining();
      return;
    }

    // Confirm before starting
    if (!window.confirm("Start CNN training? This may take several minutes.")) {
      return;
    }

    const result = await startTraining();
    if (result.success) {
      // Training started successfully
    } else {
      console.error("Failed to start training:", result.error);
    }
  };

  {/* items selected in navigation menu, default is "menu_Archive" */}
  const navigate = useNavigate();
  const onNavItemClick = (item) => {
    if (item === "menu_History") {
      navigate("/DataScientistGUI_history", "_blank");
    } else if (item === "menu_Evaluation") {
      navigate("/DataScientistGUI_evaluation", "_blank");
    } else if (item === "menu_CNNarch") {
      /* Do nothing */
    } else if (item === "menu_Dataset") {
      navigate("/DataScientistGUI_dataset", "_blank");
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
              <button className={`nav-item ${navItems === "menu_CNNarch" ? "active" : ""}`}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_CNNarch}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_Dataset")}>
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
                  <div className="cnn-panel-head">
                    <h2 className="cnn-panel-title">CNN architecture</h2>
                    <div className="cnn-legend">
                      {architectureLegend.map((item) => (
                        <span key={item.label} className={`cnn-legend-pill ${item.className}`}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="cnn-architecture-scroll">
                    <div className="cnn-architecture-track">
                      {architectureLayers.map((layer, index) => (
                        <React.Fragment key={`${layer.title}-${index}`}>
                          <article className={`cnn-layer-card ${layer.className}`}>
                            <strong>{layer.title}</strong>
                            <span>{layer.subtitle}</span>
                          </article>
                          {index < architectureLayers.length - 1 && (
                            <div className="cnn-layer-arrow" aria-hidden="true">
                              ›
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="cnn-scrollbar" aria-hidden="true">
                      <span />
                    </div>
                  </div>

                  <div className="cnn-info-grid">
                    <article className="cnn-info-card cnn-info-card-editable">
                      <div className="cnn-info-card-header">
                        <div className="cnn-info-card-title">Hyperparameters</div>
                        <div className="cnn-info-card-actions">
                          {isEditingHyperparams ? (
                            <>
                              <button 
                                type="button" 
                                className="cnn-edit-btn cnn-save-btn"
                                onClick={handleSaveHyperparams}
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button 
                                type="button" 
                                className="cnn-edit-btn cnn-cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button 
                              type="button" 
                              className="cnn-edit-btn"
                              onClick={handleEditHyperparams}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      {saveMessage && (
                        <div className={`cnn-save-message ${saveMessage.includes("Error") ? "error" : "success"}`}>
                          {saveMessage}
                        </div>
                      )}
                      <div className="cnn-spec-list">
                        {hyperparameters.map(([label, value]) => (
                          <div key={label} className="cnn-spec-row">
                            <span>{label}</span>
                            {isEditingHyperparams ? (
                              label === "Optimizer" ? (
                                <select
                                  className="cnn-spec-select"
                                  value={editedHyperparams[label] || "Adam"}
                                  onChange={(e) => handleHyperparamChange(label, e.target.value)}
                                >
                                  <option value="Adam">Adam</option>
                                  <option value="SGD">SGD</option>
                                  <option value="RMSprop">RMSprop</option>
                                  <option value="AdamW">AdamW</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  className="cnn-spec-input"
                                  value={editedHyperparams[label] || ""}
                                  onChange={(e) => handleHyperparamChange(label, e.target.value)}
                                />
                              )
                            ) : (
                              <strong>{value}</strong>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="cnn-info-card">
                      <div className="cnn-info-card-title">Data Augmentation</div>
                      <div className="cnn-spec-list">
                        {augmentation.map(([label, value]) => (
                          <div key={label} className="cnn-spec-row">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="cnn-info-card">
                      <div className="cnn-info-card-title">Model Statistic</div>
                      <div className="cnn-spec-list">
                        {statistics.map(([label, value]) => (
                          <div key={label} className="cnn-spec-row">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  <div className="cnn-actions">
                    {actionButtons.map((button) => (
                      <button
                        key={button.label}
                        type="button"
                        className={`cnn-action-btn ${button.className} ${button.label === "Start Training" && isTraining ? "training" : ""}`}
                        onClick={button.label === "Start Training" ? handleStartTraining : undefined}
                        disabled={button.label === "Start Training" && trainingStatus === "running" && !isTraining}
                      >
                        {button.label === "Start Training" && isTraining ? "Stop Training" : button.label}
                      </button>
                    ))}
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

export default DataScientistGUI_CNNarch;
