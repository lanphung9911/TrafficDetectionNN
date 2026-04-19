import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './UserGUI_static.css';
import UserGUI_describe from "./UserGUI_describe.json";
import { handleFolderSelect } from "./submit_handle";
import { API_BASE_URL, LIST_FOLDER_DIR } from "../config";

const UserGUI_static = () => {
  const navItems = "menu_Static";
  const email = localStorage.getItem("userEmail");
  const email_name = email ? email.split("@")[0] : "User";

  {/* items selected in navigation menu, default is "menu_Static" */}
  const navigate = useNavigate();
  const onNavItemClick = (item) => {
    if (item === "menu_RunTime") {
      navigate("/UserGUI_runtime", "_blank");
    }
    else if (item === "menu_Static") {
      /* Do nothing */
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
  const folderInputRef = React.useRef("null");
  const urls = [];
  const [folderName, setFolderName] = useState("");

  {/* on click of folder source, trigger hidden file input */}
  const onFolderClick = () => {
    folderInputRef.current.click();
  }

  {/* on submit of folder source */}
  const [countofImgs, setcountofImgs] = useState(0);
  const onFolderSubmit = async (event) => {
    const files = event.target.files;
    if (!folderInputRef.current) return;
    // console.log("Total files:", files.length);

    if (!files) return;
    // console.log("File selected", files);

    // reset folder name
    setImages([]);
    setCurrentImgIndex(0);
    setFolderName("");

    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      urls.push(url);

      // console log for debug
      console.log(files[i].name);
      console.log(files[i].webkitRelativePath);
    }

    setcountofImgs(files.length);

    localStorage.setItem("folder_images", JSON.stringify(urls));
    // console.log("Folder of images stored in localStorage:", urls);

    const result = await handleFolderSelect(files);

    // get folder name to show in content area
    const folder_name = files[0].webkitRelativePath.split("/")[0];
    setFolderName(folder_name);
  }

  {/* control panel for user to select next image, previous image, or reset */}
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const onNextImgClick = () => {
    if (currentImgIndex < countofImgs - 1) {
      setCurrentImgIndex(currentImgIndex + 1);
    }
  }

  const onPreviousImgClick = () => {
    if (currentImgIndex > 0) {
      setCurrentImgIndex(currentImgIndex - 1);
    }
  }

  const onResetClick = () => {
    setImages([]);
    setCurrentImgIndex(0);
    setFolderName("");
    setcountofImgs(0);
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  }

  {/* show image from folder source which provide by user */}
  const [images, setImages] = useState([]);

  useEffect(() => {
  const fetchImages = async () => {
    const res = await fetch(`${API_BASE_URL}${LIST_FOLDER_DIR}/${folderName}`);
    const data = await res.json();
    setImages(data);
  };
  fetchImages();}, 
  [folderName]);

  {/* on receive predict data from backend */}
  const [dataPredict, setDataPredict] = React.useState(null);
  React.useEffect(() => {
    let ws;
    let reconnectTimeout;

    const wsBase = new URL(API_BASE_URL);
    const wsProtocol = wsBase.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = wsProtocol + "//" + wsBase.host + "/ws/predict_img";

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
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_RunTime")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.UserGUI_describe.Navi_Menu.menu_RunTime}</span>
              </button>
              <button className={`nav-item ${navItems === "menu_Static" ? "active" : ""}`}
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
              <p className="control-subtitle">Import source of image</p>
              {/* Hidden file input for folder source */}
              <button className="btn-folder"
                onClick={onFolderClick}>
                <span className="folder-icon"> FOLDER </span>
                </button>
              <input
                type="file"
                webkitdirectory="true"
                multiple
                style={{ display: "none" }}
                ref={folderInputRef}
                onChange={onFolderSubmit}
              />

              {/* Control settings */}
              <div className="control-settings">
              <div className="setting-row">
                <span className="setting-label">{UserGUI_describe.UserGUI_describe.Control_Panel.Title}</span>
                <div className="setting-options">
                  <button 
                    className="option-btn" 
                    onClick={() => onPreviousImgClick()}
                    disabled={countofImgs === 0 || currentImgIndex === 0}
                    style={{ opacity: countofImgs === 0 || currentImgIndex === 0 ? 0.5 : 1, cursor: countofImgs === 0 || currentImgIndex === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {UserGUI_describe.UserGUI_describe.Control_Panel.Previous_Image}
                  </button>
                  <button 
                    className="option-btn" 
                    onClick={() => onNextImgClick()}
                    disabled={countofImgs === 0 || currentImgIndex >= countofImgs - 1}
                    style={{ opacity: countofImgs === 0 || currentImgIndex >= countofImgs - 1 ? 0.5 : 1, cursor: countofImgs === 0 || currentImgIndex >= countofImgs - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    {UserGUI_describe.UserGUI_describe.Control_Panel.Next_Image}
                  </button>
                  <button className="option-btn" onClick={() => onResetClick()}>
                    {UserGUI_describe.UserGUI_describe.Control_Panel.reset}
                  </button>
                </div>
              </div>
              {countofImgs > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  Image {currentImgIndex + 1} / {countofImgs}
                </div>
              )}
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="content-area">
            {/* Top Row */}
            <div className="content-row">
              {/* Camera Section */}
              <div className="card image-card">
                <div className="camera-display">
                  {images[currentImgIndex] && (
                    <img
                      src={`${API_BASE_URL}${images[currentImgIndex]}`}
                      alt={`img-${currentImgIndex}`}
                    />
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
                    <button className="btn-control"
                      onClick={() => {
                        onClickResetButton();
                      }}
                    >
                      <span className="reset-icon"> RESTART </span>
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
}

export default UserGUI_static;