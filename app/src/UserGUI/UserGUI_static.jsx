import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './UserGUI_static.css';
import UserGUI_describe from "./UserGUI_describe.json";
import { handleFolderSelect } from "./submit_handle";
import { API_BASE_URL, LIST_FOLDER_DIR, CLEANUP } from "../config";
import { getSystemVersion } from "../utils/get_system_version";
import { saveLogs } from "../utils/savelog";

const UserGUI_static = () => {
  const navItems = "menu_Static";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "User";

  // Helper function to call cleanup API
  const callCleanup = async () => {
    try {
      await fetch(`${API_BASE_URL}${CLEANUP}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      console.log("Cleanup completed");
    } catch (err) {
      console.error("Error calling cleanup:", err);
    }
  };

  // Cleanup on page load/refresh
  useEffect(() => {
    callCleanup();
  }, []);

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
  const [predictions, setPredictions] = useState([]); // Store prediction results for each image

  // Calculate top 5 most common traffic signs from predictions
  const top5TrafficSigns = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];

    // Count occurrences of each class_id
    const classCount = {};
    predictions.forEach((pred) => {
      const classId = pred.class_id;
      const name = pred.name;
      if (classCount[classId]) {
        classCount[classId].count += 1;
      } else {
        classCount[classId] = { class_id: classId, name: name, count: 1 };
      }
    });

    // Convert to array and sort by count descending
    const sorted = Object.values(classCount).sort((a, b) => b.count - a.count);

    // Take top 5
    const top5 = sorted.slice(0, 5);

    // Calculate total for percentage
    const total = predictions.length;

    // Add percentage
    return top5.map((item) => ({
      ...item,
      percent: ((item.count / total) * 100).toFixed(1),
    }));
  }, [predictions]);

  const onFolderSubmit = async (event) => {
    const files = event.target.files;
    if (!folderInputRef.current) return;

    if (!files) return;

    // reset folder name
    setImages([]);
    setCurrentImgIndex(0);
    setFolderName("");
    setPredictions([]);

    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      urls.push(url);

      // console log for debug
      console.log(files[i].name);
      console.log(files[i].webkitRelativePath);
    }

    setcountofImgs(files.length);

    localStorage.setItem("folder_images", JSON.stringify(urls));

    const result = await handleFolderSelect(files);

    // Store predictions from backend response (from predictions_*.json)
    if (result && result.predictions) {
      setPredictions(result.predictions);
    }

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

  const onResetClick = async () => {
    // Call cleanup API to delete upload folder and prediction files
    await callCleanup();
    
    setImages([]);
    setCurrentImgIndex(0);
    setFolderName("");
    setcountofImgs(0);
    setPredictions([]);
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

  {/* on click reset button to reset map marker */}
  const onClickResetButton = () => {
    // Implement the logic to reset map marker here
  };

  return (
    <div className="CommonGUI_Frame">
      <div className="dashboard-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-tags">
            <span className="tag tag-green">
              <span className="dot dot-green"></span> {UserGUI_describe.header.Title}
            </span>
            <span className="tag tag-orange">
              <span className="dot dot-orange"></span> {systemVersion ? `Version: ${systemVersion}` : "Loading version..."}
            </span> 
          </div>
          <h1 className="dashboard-title"> {UserGUI_describe.DashboardTitle.MainTitle} </h1>
          <p className="dashboard-subtitle">
            {UserGUI_describe.DashboardTitle.SubTitle}
          </p>
        </header>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="user-profile">
              <span className="welcome-text">WELCOME!</span>
              <h2 className="user-name">{email_name}</h2>
              <span className="user-role">Role: {UserGUI_describe.role}</span>
            </div>

            <nav className="nav-menu">
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_RunTime")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_RunTime}</span>
              </button>
              <button className={`nav-item ${navItems === "menu_Static" ? "active" : ""}`}
              onClick={() => onNavItemClick("menu_Static")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_Static}</span>
              </button>
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_Reference")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_Reference}</span>
              </button>
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_Feedback")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_Feedback}</span>
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
                <span className="setting-label">{UserGUI_describe.Control_Panel.Title}</span>
                <div className="setting-options">
                  <button 
                    className="option-btn" 
                    onClick={() => onPreviousImgClick()}
                    disabled={countofImgs === 0 || currentImgIndex === 0}
                    style={{ opacity: countofImgs === 0 || currentImgIndex === 0 ? 0.5 : 1, cursor: countofImgs === 0 || currentImgIndex === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {UserGUI_describe.Control_Panel.Previous_Image}
                  </button>
                  <button 
                    className="option-btn" 
                    onClick={() => onNextImgClick()}
                    disabled={countofImgs === 0 || currentImgIndex >= countofImgs - 1}
                    style={{ opacity: countofImgs === 0 || currentImgIndex >= countofImgs - 1 ? 0.5 : 1, cursor: countofImgs === 0 || currentImgIndex >= countofImgs - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    {UserGUI_describe.Control_Panel.Next_Image}
                  </button>
                  <button className="option-btn" onClick={() => onResetClick()}>
                    {UserGUI_describe.Control_Panel.reset}
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
                <div className="image-display">
                  {images[currentImgIndex] && (
                    <img
                      src={`${API_BASE_URL}${images[currentImgIndex]}`}
                      alt={`img-${currentImgIndex}`}
                    />
                  )}
                  <div className="info-overlay top-overlay">
                    <div className="info-row">
                      <span className="info-label">TimeStamp</span>
                      <span className="info-value">--</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Lat</span>
                      <span className="info-value">--</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Long</span>
                      <span className="info-value">--</span>
                    </div>
                    <div className="info-highlight">
                      <div className="info-row">
                        <span className="info-label">Traffic Sign</span>
                        <span className="info-value">{predictions[currentImgIndex]?.name || '--'}</span>
                      </div>
                      <div className="info-row" style={{ marginTop: '4px' }}>
                        <span className="info-label">Confidence</span>
                        <span className="info-value" style={{ color: '#4ade80' }}>
                          {predictions[currentImgIndex]?.confidence !== undefined ? `${predictions[currentImgIndex].confidence}%` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              <div className="card review-card">
                <h2 className="card-title center-title large-title">Review</h2>
                <p className="review-subtitle">The most 5 traffic sign detected:</p>
                <div className="progress-list">
                {top5TrafficSigns.length > 0 ? (
                  <>
                    {top5TrafficSigns.map((item, index) => (
                      <div className="progress-item" key={item.class_id}>
                        <span className="progress-label">{item.name}</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${item.percent}%` }}></div>
                          <span className="progress-value">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>No predictions yet</p>
                )}
                <div className="stats-summary">
                  <div className="stat-row">
                    <span className="stat-label">Confidence:</span>
                    <span className="stat-badge">{predictions[currentImgIndex]?.confidence !== undefined ? `${predictions[currentImgIndex].confidence}%` : '0%'}</span>
                  </div>
                </div>
                <div className="stats-summary">
                  <div className="stat-row">
                    <span className="stat-label">Total:</span>
                    <span className="stat-badge">{countofImgs}</span>
                  </div>
                </div>
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
                    <div className="info-row">
                      <span className="info-label">Lat</span>
                      <span className="info-value">--</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Long</span>
                      <span className="info-value">--</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Traffic Sign</span>
                      <span className="info-value">--</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Confidence</span>
                      <span className="info-value">--</span>
                    </div>
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