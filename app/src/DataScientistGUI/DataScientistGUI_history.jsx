import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DataScientistGUI_history.css";
import DataScientistGUI_describe from "./DataScientistGUI_describe.json";
import evaluationData from "../../../backend/src/CNN/classification_report.json";
import traininghistory_accuracy from "../../../backend/src/CNN/history_accuracy.json"
import traininghistory_loss from "../../../backend/src/CNN/history_loss.json"
import traininghistory from "../../../backend/src/CNN/history.json"
import { saveLogs } from "../utils/savelog";
import { getSystemVersion } from "../utils/get_system_version";
import { useTraining } from "./TrainingContext";

const TOTAL_EPOCHS = 50;
const EPOCH_OPTIONS = [20, 35, 50];

const summaryCards = evaluationData.summaryCards;

const generateHistoryData = () =>
  Array.from({ length: TOTAL_EPOCHS }, (_, index) => {
    const epoch = index + 1;
    const trainAcc = Math.min(
      108,
      45 + epoch * 1.2 + Math.log(epoch + 1) * 1.25 + Math.sin(epoch / 5) * 0.35
    );
    const valAcc = Math.min(
      100,
      trainAcc - (2.3 + Math.max(0, (epoch - 25) * 0.04)) + Math.sin(epoch / 8) * 0.15
    );
    const trainLoss = Math.max(
      0.04,
      2.05 * Math.exp(-epoch / 14) + 0.02 * Math.sin(epoch / 3)
    );
    const valLoss = Math.max(
      0.05,
      trainLoss + 0.08 + Math.max(0, (epoch - 20) * 0.0025)
    );

    return {
      epoch,
      trainAcc,
      valAcc,
      trainLoss,
      valLoss,
    };
  });

const historyData = traininghistory.data;

const formatNumber = (value, digits = 1) => Number(value).toFixed(digits);

const createPath = (series, valueKey, width, height, padding, yMin, yMax) => {
  if (!series.length) return "";

  const left = padding.left;
  const top = padding.top;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = series.length > 1 ? plotWidth / (series.length - 1) : 0;
  const yRange = yMax - yMin || 1;

  return series
    .map((point, index) => {
      const x = left + index * xStep;
      const normalized = (point[valueKey] - yMin) / yRange;
      const y = top + (1 - normalized) * plotHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const ChartPanel = ({
  title,
  series,
  primaryKey,
  secondaryKey,
  primaryColor,
  secondaryColor,
  legendPrimary,
  legendSecondary,
  yTicks,
  yMin,
  yMax,
  axisFormatter,
}) => {
  const width = 560;
  const height = 320;
  const padding = { top: 18, right: 22, bottom: 42, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const tickEvery = Math.max(1, Math.round(series.length / 10));
  const xStep = series.length > 1 ? plotWidth / (series.length - 1) : 0;
  const yRange = yMax - yMin || 1;
  const primaryPath = createPath(series, primaryKey, width, height, padding, yMin, yMax);
  const secondaryPath = createPath(series, secondaryKey, width, height, padding, yMin, yMax);

  const pointPosition = (index, valueKey) => {
    const point = series[index];
    const normalized = (point[valueKey] - yMin) / yRange;
    return {
      x: padding.left + index * xStep,
      y: padding.top + (1 - normalized) * plotHeight,
    };
  };

  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <div className="chart-frame">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-label={title}
          role="img"
        >
          {yTicks.map((tick) => {
            const normalized = (tick - yMin) / yRange;
            const y = padding.top + (1 - normalized) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e7edf6"
                  strokeDasharray="3 5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#9aa4b2"
                >
                  {axisFormatter(tick)}
                </text>
              </g>
            );
          })}

          {series.map((point, index) => {
            if (index % tickEvery !== 0 && index !== series.length - 1) return null;
            const x = padding.left + index * xStep;
            return (
              <g key={point.epoch}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#edf2f7"
                  strokeDasharray="3 5"
                />
                <text
                  x={x}
                  y={height - 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#9aa4b2"
                >
                  {point.epoch}
                </text>
              </g>
            );
          })}

          <path
            d={primaryPath}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={secondaryPath}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 4"
          />

          {series.length > 0 && (
            <>
              {(() => {
                const lastIndex = series.length - 1;
                const primaryEnd = pointPosition(lastIndex, primaryKey);
                const secondaryEnd = pointPosition(lastIndex, secondaryKey);

                return (
                  <>
                    <circle
                      cx={primaryEnd.x}
                      cy={primaryEnd.y}
                      r="4"
                      fill="#ffffff"
                      stroke={primaryColor}
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={secondaryEnd.x}
                      cy={secondaryEnd.y}
                      r="4"
                      fill="#ffffff"
                      stroke={secondaryColor}
                      strokeWidth="2.5"
                    />
                  </>
                );
              })()}
            </>
          )}

          <text
            x={padding.left + plotWidth / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="#667085"
          >
            Epoch
          </text>
        </svg>
      </div>
      <div className="chart-legend">
        <span className="chart-legend-item" style={{ color: primaryColor }}>
          <span className="legend-dot" />
          {legendPrimary}
        </span>
        <span className="chart-legend-item" style={{ color: secondaryColor }}>
          <span className="legend-dot" />
          {legendSecondary}
        </span>
      </div>
    </section>
  );
};

const DataScientistGUI_history = () => {
  const navItems = "menu_History";
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
      /* Do nothing */
    } else if (item === "menu_Evaluation") {
      navigate("/DataScientistGUI_evaluation", "_blank");
    } else if (item === "menu_trainpipeline") {
      navigate("/DataScientistGUI_TrainPipeline", "_blank");
    } else if (item === "menu_Dataset") {
      navigate("/DataScientistGUI_dataset", "_blank");
    } else {
      /* Do nothing */
    }
  };

  const [selectedEpochs, setSelectedEpochs] = useState(50);
  const visibleHistory = historyData.slice(0, selectedEpochs);

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
              <button className={`nav-item ${navItems === "menu_History" ? "active" : ""}`}>
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
              <button className="nav-item" onClick={() => onNavItemClick("menu_Dataset")}>
                <div className="nav-icon"></div>
                <span>{DataScientistGUI_describe.Navi_Menu.menu_Dataset}</span>
              </button>
            </nav>
          </aside>

          <div className="ds-area history-dashboard">
            <div className="ds-main-dashboard">
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

                  <div className="history-main-head">
                    <div className="history-title-group">
                      <h2 className="history-section-title">Training history</h2>
                      <p className="history-section-subtitle">Accuracy &amp; Loss per epoch</p>
                    </div>

                    <div className="history-display-group">
                      <span className="history-display-label">Display</span>
                      <div className="epoch-switcher">
                        {EPOCH_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`epoch-btn ${selectedEpochs === option ? "active" : ""}`}
                            onClick={() => setSelectedEpochs(option)}
                          >
                            {option} epoch
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="charts-grid">
                    <ChartPanel
                      title="Accuracy (Train vs Validation)"
                      series={visibleHistory}
                      primaryKey="trainAcc"
                      secondaryKey="valAcc"
                      primaryColor="#10b981"
                      secondaryColor="#4f83ff"
                      legendPrimary="Train Acc"
                      legendSecondary="Val Acc"
                      yTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
                      yMin={Math.min(...visibleHistory.flatMap(item => [item.trainAcc, item.valAcc]))}
                      yMax={1.1}
                      axisFormatter={(value) => formatNumber(value, 2)}
                    />

                    <ChartPanel
                      title="Loss (Train vs Validation)"
                      series={visibleHistory}
                      primaryKey="trainLoss"
                      secondaryKey="valLoss"
                      primaryColor="#ff7a1a"
                      secondaryColor="#ff4d4f"
                      legendPrimary="Train Loss"
                      legendSecondary="Val Loss"
                      yTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
                      yMin={0}
                      yMax={Math.max(...visibleHistory.flatMap(item => [item.trainLoss, item.valLoss]))}
                      axisFormatter={(value) => formatNumber(value, 2)}
                    />
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

export default DataScientistGUI_history;
