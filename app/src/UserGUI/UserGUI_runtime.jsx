import React from 'react';
import { useNavigate } from "react-router-dom";
import './UserGUI_runtime.css';
import UserGUI_describe from "./UserGUI_describe.json";
import { handleVideoOption, handleVideoSubmit } from "./submit_handle";
import { API_BASE_URL } from "../config";

const UserGUI_runtime = () => {
  const navItems = "menu_RunTime";
  const email = localStorage.getItem("userEmail");
  const email_name = email ? email.split("@")[0] : "User";

  {/* items selected in navigation menu, default is "menu_RunTime" */}
  const navigate = useNavigate();
  const onNavItemClick = (item) => {
    if (item === "menu_RunTime") {
      /* Do nothing */
    }
    else if (item === "menu_Static") {
      navigate("/UserGUI_static", "_blank");
    }
    else if (item === "menu_Reference") {
      navigate("/UserGUI_reference", "_blank");
    }
    else if (item === "menu_Feedback") {
      navigate("/UserGUI_feedback", "_blank");
    }
    else { /* Do nothing */ }
  }

  {/* camera submit source to display */}
  const fileInputRef = React.useRef();
  const [videoUrl, setVideoUrl] = React.useState(null);
  const onCameraClick = () => {
    fileInputRef.current.click();
  }
  const onCameraSubmit = async (event) => {
    const file = event.target.files[0];
    if (!fileInputRef.current) return; //user didn't select file yet
    console.log("File curent", fileInputRef.current);

    if (!file) return; //user didn't select file yet
    // console.log("File selected", file);

    const videoUrl = URL.createObjectURL(file);
    setVideoUrl(videoUrl);
    // console.log("VideoURL", videoUrl);

    localStorage.setItem("VideoURL", videoUrl);
    // console.log("VideoURL in localStorage", localStorage.getItem("VideoURL"));
  
    const result = await handleVideoSubmit(file);
    // console.log("Video upload result", result); //log console return to debug only
  }

  {/* FPS and Speed options click handler */}
  const FPS_OPTIONS = [
    UserGUI_describe.UserGUI_describe.FPS_Option.option_1,
    UserGUI_describe.UserGUI_describe.FPS_Option.option_2,
    UserGUI_describe.UserGUI_describe.FPS_Option.option_3,
  ];
  const SPEED_OPTIONS = [
    UserGUI_describe.UserGUI_describe.Speed_Option.option_1,
    UserGUI_describe.UserGUI_describe.Speed_Option.option_2,
    UserGUI_describe.UserGUI_describe.Speed_Option.option_3,
  ];
  const [FPSOption, setFPSOption] = React.useState(FPS_OPTIONS[0]);
  const [SpeedOption, setSpeedOption] = React.useState(SPEED_OPTIONS[0]);

  const onVideoOptionClick = async (option_fps, option_speed) => {
    if (option_fps && option_fps !== FPSOption) {
      setFPSOption(option_fps);
    }
    if (option_speed && option_speed !== SpeedOption) {
      setSpeedOption(option_speed);
    }
    const result = await handleVideoOption(
      option_fps || FPSOption,
      option_speed || SpeedOption
    );
    // console.log("Video option result", result);
  
    // reset file input
    fileInputRef.current.value = "";
  };

  {/* on receive predict data from backend */}
  const [dataPredict, setDataPredict] = React.useState(null);
  React.useEffect(() => {
    let ws;
    let reconnectTimeout;

    const wsBase = new URL(API_BASE_URL);
    const wsProtocol = wsBase.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = wsProtocol + "//" + wsBase.host + "/ws/predict_vid";

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data_received = JSON.parse(event.data);
          setDataPredict(data_received);
        } catch (err) {
          console.error("Invalid payload:", err);
        }
      };
      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 500);
      };
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  {/* on click reset button to reset map marker */}
  const onClickResetButton = () => {
    // Implement the logic to reset map marker here
  };

  return (
    <div className="UserGUI_Frame">
      <div className="dashboard-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-tags">
            <span className="tag tag-green">
              <span className="dot dot-green"></span> {UserGUI_describe.UserGUI_describe.header.Title}
            </span>
            <span className="tag tag-orange">
              <span className="dot dot-orange"></span> {UserGUI_describe.UserGUI_describe.header.Version}
            </span> 
          </div>
          <h1 className="dashboard-title"> {UserGUI_describe.UserGUI_describe.DashboardTitle.MainTitle} </h1>
          <p className="dashboard-subtitle">
            {UserGUI_describe.UserGUI_describe.DashboardTitle.SubTitle}
          </p>
        </header>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="user-profile">
              <span className="welcome-text">WELCOME!</span>
              <h2 className="user-name">{email_name}</h2>
              <span className="user-role">Role: User</span>
            </div>

            <nav className="nav-menu">
              <button className={`nav-item ${navItems === "menu_RunTime" ? "active" : ""}`}
              onClick={() => onNavItemClick("menu_RunTime")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.UserGUI_describe.Navi_Menu.menu_RunTime}</span>
              </button>
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_Static")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.UserGUI_describe.Navi_Menu.menu_Static}</span>
              </button>
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_Reference")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.UserGUI_describe.Navi_Menu.menu_Reference}</span>
              </button>
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_Feedback")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.UserGUI_describe.Navi_Menu.menu_Feedback}</span>
              </button>
            </nav>

            <div className="control-panel">
              <h3 className="control-title">LET'S START</h3>
              <p className="control-subtitle">Import source of video</p>
              <button className="btn-camera"
                onClick={onCameraClick}>
                <span className="camera-icon"> CAMERA </span>
                </button>
              {/* Hidden file input for camera source */}
              <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onCameraSubmit}
              />
              <div className="control-settings">
              <div className="setting-row">
                <span className="setting-label">{UserGUI_describe.UserGUI_describe.FPS_Option.Title}</span>
                <div className="setting-options">
                  {FPS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`option-btn ${FPSOption === opt ? "active" : ""}`}
                      onClick={() => onVideoOptionClick(opt, null)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-label">{UserGUI_describe.UserGUI_describe.Speed_Option.Title}</span>
                <div className="setting-options">
                  {SPEED_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`option-btn ${SpeedOption === opt ? "active" : ""}`}
                      onClick={() => onVideoOptionClick(null, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="content-area">
            {/* Top Row */}
            <div className="content-row">
              {/* Camera Section */}
              <div className="card camera-card">
                <div className="camera-display">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span className="placeholder-text">Camera source display</span>
                  )}                  
                  <div className="info-overlay top-overlay">
                    <p>TimeStamp:</p>
                    <p>Lat:</p>
                    <p>Long:</p>
                    <p>Traffic Sign:</p>
                    <p>Confidence:</p>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              <div className="card review-card">
                <h2 className="card-title center-title large-title">Review</h2>
                <p className="review-subtitle">The most 5 traffic sign detected:</p>
                <div className="progress-list">
                {dataPredict && (
                  <>
                      {/* first top traffic sign count and percent */}
                      <div className="progress-item">
                        <span className="progress-label">{dataPredict.traffic_sign_1}</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${dataPredict.percent_of_total_1}%` }}></div>
                        </div>
                        <span className="progress-value">{dataPredict.count_1}</span>
                      </div>
                      {/* second top traffic sign count and percent */}
                      <div className="progress-item">
                        <span className="progress-label">{dataPredict.traffic_sign_2}</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${dataPredict.percent_of_total_2}%` }}></div>
                        </div>
                        <span className="progress-value">{dataPredict.count_2}</span>
                      </div>
                      {/* third top traffic sign count and percent */}
                      <div className="progress-item">
                        <span className="progress-label">{dataPredict.traffic_sign_3}</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${dataPredict.percent_of_total_3}%` }}></div>
                        </div>
                        <span className="progress-value">{dataPredict.count_3}</span>
                      </div>
                      {/* fourth top traffic sign count and percent */}
                      <div className="progress-item">
                        <span className="progress-label">{dataPredict.traffic_sign_4}</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${dataPredict.percent_of_total_4}%` }}></div>
                        </div>
                        <span className="progress-value">{dataPredict.count_4}</span>
                      </div>
                      {/* fifth top traffic sign count and percent */}
                      <div className="progress-item">
                        <span className="progress-label">{dataPredict.traffic_sign_5}</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${dataPredict.percent_of_total_5}%` }}></div>
                        </div>
                        <span className="progress-value">{dataPredict.count_5}</span>
                      </div>
                      <div className="stats-summary">
                        <div className="stat-row">
                          <span className="stat-label">Total:</span>
                          <span className="stat-badge">{dataPredict.total_count}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">Confidence:</span>
                          <span className="stat-badge">{dataPredict.confidence}%</span>
                        </div>
                      </div>
                  </>
                )}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="content-row bottom-row">
              {/* Map Section */}
              <div className="card map-card">
                <div className="map-display">
                  <span className="placeholder-text">Map with marker</span>
                  <div className="info-overlay bottom-overlay">
                    <p>Lat:</p>
                    <p>Long:</p>
                    <p>Traffic Sign:</p>
                    <p>Confidence:</p>
                  </div>
                </div>
              </div>

              {/* User Control Section */}
              <div className="card user-control-card">
                <h2 className="card-title center-title large-title">User control</h2>
                <div className="control-actions">
                  <div className="action-item">
                    <button className="btn-control">RESTART</button>
                    <p className="action-desc">Stop system with reset map marker</p>
                  </div>
                  <div className="action-item">
                    <button className="btn-control"
                      onClick={() => {
                        onClickResetButton();
                      }}
                    >
                      <span className="reset-icon"> RESET </span>
                    </button>
                    <p className="action-desc">Reset map marker for all traffic sign type</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
   </div>
  );
};

export default UserGUI_runtime;