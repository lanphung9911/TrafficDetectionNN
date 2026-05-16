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
    if (item === "menu_Static") {
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
    if (result && result.predictions && result.predictions.length > 0) {
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
      console.log(predictions[currentImgIndex]);
    }
  }

  const onPreviousImgClick = () => {
    if (currentImgIndex > 0) {
      setCurrentImgIndex(currentImgIndex - 1);
    }
  }

  const onResetClick = async () => {    
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

  {/* Create a mapping of filename to prediction for easy lookup */}
  const predMap = useMemo(() => {
    const map = {};
    predictions.forEach((p) => {
      const file = p.org_img_path?.split("\\").pop();
      map[file] = p;
    });
    return map;
  }, [predictions]);

  const imgPath = images[currentImgIndex];
  const fileName = imgPath?.split("/").pop();
  const pred = predMap[fileName];

  const currentPred = predictions.filter((p) => {
    const file = p.org_img_path?.split("\\").pop();
    const imgFile = images[currentImgIndex]?.split("/").pop();
    return file === imgFile;
  });

  {/* Calculate average confidence for current image's predictions */}
  const calculateCurrImgConf = currentPred.reduce((acc, item) => acc + (item.confidence || 0), 0) / (currentPred.length || 1);

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
              {/* Image Section */}
              <div className="card image-card">
                <div className="image-display">
                  {images[currentImgIndex] ? (
                    <img
                      src={`${API_BASE_URL}${imgPath}`}
                      alt="org"
                    />
                  ) : (
                    <span className="map-display-txt">
                      Loading image ...
                    </span>
                  )}
                </div>
              </div>

              {/* Review Section */}
              <div className="card review-card">
                <h2 className="card-title center-title large-title">Review</h2>
                <p className="review-subtitle">Prediction from model</p>
                <div className="progress-list">
                  {currentPred.length > 0 ? (
                    currentPred.map((item, idx) => (
                      <div className="progress-item" key={idx}>
                        <span className="progress-label">{item.name}</span>

                        <div className="progress-bar-container">
                          <div className="progress-bg">
                            <div
                              className="progress-bar"
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                          <span className="progress-value">
                            {(item.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#999", fontSize: "12px", textAlign: "center" }}>
                      No prediction for this image
                    </p>
                  )}
                </div>
                <div className="stats-summary">
                  <div className="stat-row">
                    <span className="stat-label">Confidence:</span>
                    <span className="stat-badge">{(calculateCurrImgConf * 100).toFixed(1)}%</span>
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

            {/* Bottom Row */}
            <div className="content-row bottom-row">
              {/* Map Section */}
              <div className="card map-card">
                <div className="map-display">
                  {pred?.pred_img_path ? (
                    <img
                      src={`${API_BASE_URL}/${pred.pred_img_path.replace(/\\/g, "/")}`}
                      alt="prediction"
                    />
                  ) : (
                    <span className="map-display-txt">
                      No prediction image available
                    </span>
                  )}
                </div>
              </div>

              {/* User Control Section */}
              <div className="card user-control-card">
                <h2 className="card-title center-title large-title">User control</h2>
                <div className="control-actions">
                  {/* Temporarily reserved for future use, currently no action */}
                  {/* <div className="action-item">
                    <button className="btn-control"
                      onClick={() => {
                        onClickResetButton();
                      }}
                    >
                      <span className="reset-icon"> RESERVED </span>
                    </button>
                    <p className="action-desc">Reserved</p>
                  </div> */}
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