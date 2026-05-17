import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DataScientistGUI_evaluation.css";
import DataScientistGUI_describe from "./DataScientistGUI_describe.json";
import evaluationData from "../../../backend/src/CNN/classification_report.json";
import { saveLogs } from "../utils/savelog";
import { getSystemVersion } from "../utils/get_system_version";
import { useTraining } from "./TrainingContext";

const summaryCards = evaluationData.summaryCards;

const radarLegend = [
  { label: "v2.1 (Current)", className: "legend-current" },
  { label: "v2.0 (Previous)", className: "legend-previous" },
];

const confusionItems = [
  { title: "Speed 50", text: "Predict a Speed 30", count: "12 lần", rate: "2.1% error rate" },
  { title: "Speed 80", text: "Predict a Speed 50", count: "9 lần", rate: "1.8% error rate" },
  { title: "No Entry", text: "Predict a Yield", count: "4 lần", rate: "0.9% error rate" },
  { title: "Speed 80", text: "Predict a No Vehicles", count: "6 lần", rate: "1.4% error rate" },
];

const versionRows = [
  {
    version: "v2.2",
    status: "95.8%",
    trainAcc: "93.4%",
    valAcc: "45",
    epoch: "0.000564",
    lr: "Adam",
    batch: "2.3M",
    optimizer: "—",
    params: "15/03/2026",
    deploy: "A",
  },
  {
    version: "v2.1",
    status: "95.8%",
    trainAcc: "93.4%",
    valAcc: "45",
    epoch: "0.000564",
    lr: "Adam",
    batch: "2.3M",
    optimizer: "—",
    params: "15/03/2026",
    deploy: "B",
  },
];

const DataScientistGUI_evaluation = () => {
  const navItems = "menu_Evaluation";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "Data Scientist";

  {/* get system version from backend and display it */}
  const [systemVersion, setSystemVersion] = useState(null);

  {/* Use training context for global state management */}
  const { trainingProgress, trainingStatus, trainingMessage } = useTraining();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ver = await getSystemVersion();
      if (!mounted || ver === null || ver === undefined) return;
      setSystemVersion(ver);
    })();
    return () => { mounted = false; };
  }, []);

  {/* items selected in navigation menu, default is "menu_Archive" */}
  const navigate = useNavigate();
  const onNavItemClick = (item) => {
    if (item === "menu_History") {
      navigate("/DataScientistGUI_history", "_blank");
    } else if (item === "menu_evaluation") {
      /* Do nothing */
    } else if (item === "menu_trainpipeline") {
      navigate("/DataScientistGUI_TrainPipeline", "_blank");
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
              <button className={`nav-item ${navItems === "menu_Evaluation" ? "active" : ""}`}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_Evaluation}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_trainpipeline")}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_trainpipeline}</span>
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
                  <div className="ds-panel-grid">
                    <div className="ds-panel-left">
                      <h2 className="ds-panel-title">Radar Chart</h2>
                      <div className="radar-wrap" aria-hidden="true">
                        <div className="radar-label radar-top">Accuracy</div>
                        <div className="radar-label radar-right">Precision</div>
                        <div className="radar-label radar-mid-right">Recall</div>
                        <div className="radar-label radar-bottom">F1-Score</div>
                        <div className="radar-label radar-left-bottom">Speed</div>
                        <div className="radar-label radar-left-top">Robustness</div>
                        <div className="radar-graph">
                          <div className="radar-rings"></div>
                          <div className="radar-shape radar-current"></div>
                          <div className="radar-shape radar-previous"></div>
                        </div>
                      </div>

                      <div className="radar-legend">
                        {radarLegend.map((item) => (
                          <span key={item.label} className={`radar-legend-item ${item.className}`}>
                            <span className="radar-legend-swatch"></span>
                            {item.label}
                          </span>
                        ))}
                      </div>

                      <h3 className="version-section-title">History version of model</h3>
                      <div className="version-table">
                        <div className="version-table-head">
                          <span>Version</span>
                          <span>Status</span>
                          <span>Train Acc</span>
                          <span>Val Acc</span>
                          <span>Epochs</span>
                          <span>LR</span>
                          <span>Batch</span>
                          <span>Optimizer</span>
                          <span>Params</span>
                          <span>Deploy Date</span>
                        </div>
                        {versionRows.map((row) => (
                          <div className="version-table-row" key={row.version}>
                            <span className="version-cell version-strong">{row.version}</span>
                            <span className="version-cell version-green">{row.status}</span>
                            <span className="version-cell">{row.trainAcc}</span>
                            <span className="version-cell">{row.valAcc}</span>
                            <span className="version-cell">{row.epoch}</span>
                            <span className="version-cell">{row.lr}</span>
                            <span className="version-cell">{row.batch}</span>
                            <span className="version-cell">{row.optimizer}</span>
                            <span className="version-cell">{row.params}</span>
                            <span className="version-cell">{row.deploy}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ds-panel-right">
                      <h2 className="ds-panel-title">Common Error (Confusion Highlights)</h2>
                      <div className="error-list">
                        {confusionItems.map((item) => (
                          <article className="error-item" key={`${item.title}-${item.text}`}>
                            <div className="error-icon">!</div>
                            <div className="error-copy">
                              <div className="error-line">
                                <strong>{item.title}</strong> {'>'} {item.text}
                              </div>
                              <div className="error-meta">
                                {item.count} - {item.rate}
                              </div>
                            </div>
                            <div className="error-bar">
                              <span />
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className="performance-box">
                        <div className="performance-title">✓ Performance v2.1</div>
                        <div className="performance-grid">
                          <div className="performance-item">
                            <span>Top-1 Accuracy</span>
                            <strong>94.3%</strong>
                          </div>
                          <div className="performance-item">
                            <span>Top-5 Accuracy</span>
                            <strong>99.1%</strong>
                          </div>
                          <div className="performance-item">
                            <span>Avg Inference</span>
                            <strong>0.3s</strong>
                          </div>
                          <div className="performance-item">
                            <span>Test Samples</span>
                            <strong>12,630</strong>
                          </div>
                        </div>
                      </div>
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

export default DataScientistGUI_evaluation;
