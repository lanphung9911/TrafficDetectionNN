import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DataScientistGUI_Dataset.css";
import DataScientistGUI_describe from "./DataScientistGUI_describe.json";
import evaluationData from "./MatrixScore.json";
import { saveLogs } from "../utils/savelog";
import { getSystemVersion } from "../utils/get_system_version";

const summaryCards = evaluationData.summaryCards;

const classDistribution = [
  { label: "Speed 30", value: 2200, color: "#4f83ff" },
  { label: "Right-of-Way", value: 1800, color: "#8b5cf6" },
  { label: "Yield", value: 2100, color: "#ec4899" },
  { label: "No", value: 1400, color: "#f97316" },
  { label: "Vehicles", value: 1200, color: "#f59e0b" },
  { label: "Other", value: 9100, color: "#10b981" },
];

const datasetSpecs = [
  { label: "Train/Validation Split", value: "80% / 20%" },
  { label: "Preprocessing", value: "Resize 32×32, Normalize" },
  { label: "Imbalanced Classes", value: "Have (10x ratio)" },
  { label: "Augmentation", value: "Rotation, Zoom, Shift" },
  { label: "Color Space", value: "RGB" },
  { label: "Label Format", value: "One-hot (43 classes)" },
];

const actionButtons = [
  { label: "Start Training", className: "primary" },
  { label: "Upload Dataset", className: "secondary" },
  { label: "Export Model (.h5)", className: "ghost" },
  { label: "Show on GitHub", className: "ghost" },
];

const DataScientistGUI_Dataset = () => {
  const navItems = "menu_Dataset";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "Data Scientist";

  {/* get system version from backend and display it */}
  const [systemVersion, setSystemVersion] = useState(null);
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
    } else if (item === "menu_Evaluation") {
      navigate("/DataScientistGUI_evaluation", "_blank");
    } else if (item === "menu_CNNarch") {
      navigate("/DataScientistGUI_CNNarch", "_blank");
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
              <button className="nav-item" onClick={() => onNavItemClick("menu_CNNarch")}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_CNNarch}</span>
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
                      <h2 className="cnn-panel-title">Class Distribution (Top 10)</h2>
                      <div className="class-chart-frame">
                        <svg className="class-chart-svg" viewBox="0 0 560 260" preserveAspectRatio="none">
                          {classDistribution.map((item, index) => {
                            const y = 24 + index * 36;
                            const barWidth = Math.max(52, (item.value / 10000) * 360);
                            return (
                              <g key={item.label}>
                                <text x="16" y={y + 14} className="class-chart-label">
                                  {item.label}
                                </text>
                                <rect x="120" y={y} width="360" height="16" fill="#eef2ff" rx="5" />
                                <rect x="120" y={y} width={barWidth} height="16" fill={item.color} rx="5" />
                                <text x="112" y={y + 14} className="class-chart-axis">
                                  {index === 0 ? "0" : ""}
                                </text>
                              </g>
                            );
                          })}
                          <line x1="120" y1="220" x2="480" y2="220" stroke="#cbd5e1" />
                          {[0, 2500, 5000, 7500, 10000].map((tick) => {
                            const x = 120 + (tick / 10000) * 360;
                            return (
                              <g key={tick}>
                                <line x1={x} y1="220" x2={x} y2="226" stroke="#cbd5e1" />
                                <text x={x} y="242" textAnchor="middle" className="class-chart-tick">
                                  {tick}
                                </text>
                              </g>
                            );
                          })}
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
                    {actionButtons.map((button) => (
                      <button key={button.label} type="button" className={`cnn-action-btn ${button.className}`}>
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <footer className="ds-footer">
                <div className="ds-footer-title">
                  <strong>Model CNN v2.2 Training...</strong>
                  <span>Epoch 45/50 - Val Acc: 93.4% - ETA: ~3 min</span>
                </div>

                <div className="ds-progress-block">
                  <div className="ds-progress-copy">
                    <span>Progress: 90%</span>
                  </div>
                  <div className="ds-progress-track" aria-hidden="true">
                    <div className="ds-progress-fill" />
                  </div>
                  <div className="ds-progress-eta">~3 min remaining</div>
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
