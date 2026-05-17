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
                <div className="ds-panel-shell"></div>
                  <span className="ds-panel-title">New feature ... To be update in version 2</span>
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
