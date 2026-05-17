import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './UserGUI_feedback.css';
import UserGUI_describe from "./UserGUI_describe.json";
import { fetchFeedback, handleFeedback } from "./feedback_handle";
import { getSystemVersion } from "../utils/get_system_version";

const UserGUI_feedback = () => {
  const navItems = "menu_Feedback";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "User";
  const navigate = useNavigate();
  const [userFeedbackList, setuserFeedbackList] = useState(null);

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

  {/* items selected in navigation menu, default is "menu_Feedback" */}
  const onNavItemClick = (item) => {
    if (item === "menu_Static") {
      navigate("/UserGUI_static", "_blank");
    } else if (item === "menu_Reference") {
      navigate("/UserGUI_reference", "_blank");
    } else if (item === "menu_Feedback") {
      /* Do nothing */
    }
  };

  const [countofImgs, setcountofImgs] = useState(0);
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

  const [rating, setRating] = useState(5);
  const [evaluateOption, setEvaluateOption] = useState(UserGUI_describe.Evaluation.Content_1);
  const [attachFile, setAttachFile] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const fileInputRef = React.useRef(null);

  const onAttachmentClick = () => {
    fileInputRef.current.click();
  }

  const onAttachmentChange = () => {
    const file = fileInputRef.current.files[0] || null;
    if (!fileInputRef.current) return; // safety check, user did not select a file and closed the dialog
    setAttachFile(file); // set attached file to display in UI
  }

  const onFeedbackSubmit = async () => {
    try {
      const result = await handleFeedback({
        email_name,
        rating,
        evaluateOption,
        attachFile,
        feedbackText,
      });
      console.log("Feedback submitted:", result);
      onFeedbackClear();

      alert("Feedback submitted successfully!");
    } catch (e) {
      console.error("Submit failed:", e);
      alert("Failed to submit feedback. Please try again later.");
    }
  };

  const onFeedbackClear = () => {
    setRating(5);
    setEvaluateOption(null);
    setAttachFile(null);
    setFeedbackText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const total_count = userFeedbackList ? userFeedbackList.length : 0;
  const avg_confidence = userFeedbackList && userFeedbackList.length > 0
    ? userFeedbackList.reduce((sum, item) => sum + (item.rating || 0), 0) / userFeedbackList.length
    : 0;

  {/* fetch feedback data when component mounts */}
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const items = await fetchFeedback({ email_name });
        if (!mounted) return;
        setuserFeedbackList(Array.isArray(items) ? items : []);
        console.log("Fetched feedback:", items);
      }
      catch (err) {
        /* Save log to backend */
        await saveLogs(email_name, [{
          timestamp: new Date().toISOString(),
          email_name: email_name,
          navigateItem: navItems,
          event: "fetch_feedback_by_user_failed",
          error: err.message
        }]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

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
              onClick={() => onNavItemClick("menu_Static")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_Static}</span>
              </button>
              <button className={`nav-item`}
              onClick={() => onNavItemClick("menu_Reference")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_Reference}</span>
              </button>
              <button className={`nav-item ${navItems === "menu_Feedback" ? "active" : ""}`}
              onClick={() => onNavItemClick("menu_Feedback")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.Navi_Menu.menu_Feedback}</span>
              </button>
            </nav>

            <div className="control-panel">
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
                  <button className="option-btn" onClick={() => onFeedbackClear()}>
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
              {/* Feedback Input Section */}
              <div className="card feedback-card">
                <div className="fb-row-inline">
                  <span className="fb-label">{UserGUI_describe.Feedback.Feedback_Id}:</span>
                  <span className="fb-user-id">1234567890</span>
                </div>
                <span className="fb-label">{UserGUI_describe.Feedback.SubTitle_1}</span>
                <textarea
                  className="feedback-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Type your feedback here..."
                />
              </div>

              {/* Review Section */}
              <div className="card review-card">
                <h2 className="card-title center-title large-title">Your Experience</h2>
                <p className="review-subtitle">{UserGUI_describe.Feedback.SubTitle_2}</p>
                <div className="user-fb-list">
                  {userFeedbackList && (
                    <>
                        {userFeedbackList.map((feedback, index) => (
                          <div key={index} className="user-fb-item">
                            <span className="user-fb-timestamp">{feedback.timestamp}</span>
                            <span className={`user-fb-status ${feedback.status.toLowerCase()}`}>
                              {feedback.status}
                            </span>
                          </div>
                        ))}
                    </>
                )}
                </div>

                {userFeedbackList && (
                  <div className="stats-summary">
                    <div className="stat-row">
                      <span className="stat-label">Rating:</span>
                      <span className="stat-badge">{avg_confidence}%</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total feedback:</span>
                      <span className="stat-badge">{total_count}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Row */}
            <div className="content-row bottom-row">
              {/* Feedback text area */}
              <div className="card feedback-card">
                {/* Rating */}
                <div className="fb-section fb-row-inline">
                  <span className="fb-label">{UserGUI_describe.Rating.Title}</span>
                  <span className="fb-rating-bound">{UserGUI_describe.Rating.Min}</span>
                  <input
                    type="range" min={UserGUI_describe.Rating.Min} max={UserGUI_describe.Rating.Max} step={UserGUI_describe.Rating.Step}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="fb-slider"
                  />
                  <span className="fb-rating-bound">{UserGUI_describe.Rating.Max}</span>
                  <span className="fb-rating-value">{rating}</span>
                </div>

                {/* Attachment */}
                <div className="fb-section">
                  <div className="fb-row-inline fb-spread">
                    <span className="fb-label">Attachment</span>
                    <div className="fb-row-inline">
                      <button className="fb-btn fb-btn-browse"
                      onClick={onAttachmentClick}>
                      <span>BROWSE</span>
                      </button>
                      <span className="fb-filename">{attachFile ? attachFile.name : "No attachment from user. Attachment allowed for images only."}</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={onAttachmentChange}
                  />
                </div>

                {/* Evaluate */}
                <div className="fb-section fb-row-inline">
                  <span className="fb-label">{UserGUI_describe.Evaluation.Title}</span>
                  {[UserGUI_describe.Evaluation.Content_1, 
                    UserGUI_describe.Evaluation.Content_2, 
                    UserGUI_describe.Evaluation.Content_3].map((opt) => (
                    <button
                      key={opt}
                      className={`fb-btn fb-btn-eval ${evaluateOption === opt ? "active" : ""}`}
                      onClick={() => setEvaluateOption(evaluateOption === opt ? null : opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="fb-actions">
                  <button className="fb-btn fb-btn-submit" onClick={onFeedbackSubmit}>SUBMIT</button>
                  <button className="fb-btn fb-btn-clear" onClick={onFeedbackClear}>CLEAR</button>
                </div>
              </div>

              {/* User Control Section */}
              <div className="card user-control-card">
                <h2 className="card-title center-title large-title">User control</h2>
                <div className="control-actions">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
   </div>
  );
}

export default UserGUI_feedback;