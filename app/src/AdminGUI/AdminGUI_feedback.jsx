import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminGUI_feedback.css";
import AdminGUI_describe from "./AdminGUI_describe.json";
import { API_BASE_URL } from "../config";
import { fetchAdminFeedback, sendAdminReply } from "./feedback_manage";
import { saveLogs } from "../utils/savelog";
import { getSystemVersion } from "../utils/get_system_version";

const paperclipIcon = String.fromCodePoint(0x1F4CE);

const AdminGUI_feedback = () => {
  const navItems = "menu_Feedback";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "Admin";
  const navigate = useNavigate();

  const [feedbackItems, setFeedbackItems] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null); // { url, name } | null

  const onAttachmentClick = (e, item) => {
    e.stopPropagation();
    if (!item?.attachmentUrl) return;
    setPreviewAttachment({ url: item.attachmentUrl, name: item.attachment });
  };

  const closeAttachmentPreview = () => setPreviewAttachment(null);

  useEffect(() => {
    if (!previewAttachment) return;
    const onKey = (e) => { if (e.key === "Escape") closeAttachmentPreview(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewAttachment]);
  
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
    if (item === "menu_UserMonitor") {
      navigate("/AdminGUI_monitoring", "_blank");
    } else if (item === "menu_Feedback") {
      /* Do nothing */
    } else if (item === "menu_Archive") {
      navigate("/AdminGUI_archive", "_blank");
    } else {
      /* Do nothing */
    }
  };

  {/* helper function to convert status to CSS class */}
  const statusToClass = (status) => {
    if (!status) return "pill-pending";
    const s = status.toLowerCase();
    if (s === "replied") return "pill-replied";
    if (s === "analyze" || s === "analyzing") return "pill-analyze";
    if (s === "spam") return "pill-spam";
    if (s === "close") return "pill-close";
    return "pill-pending";
  };

  {/* helper function to convert status to quick reply text */}
  const statusToQuickText = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "replied") return "";
    if (s === "analyze") return AdminGUI_describe.Feedback_quickText.Analyze;
    if (s === "spam") return AdminGUI_describe.Feedback_quickText.Spam;
    if (s === "close") {
      return selectedFeedback?.reply?.trim()
        ? selectedFeedback.reply
        : AdminGUI_describe.Feedback_quickText.Close;
    }
    return "";
  }

  {/* fetch feedback data when component mounts */}
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const items = await fetchAdminFeedback(API_BASE_URL);
        if (!mounted) return;
        setFeedbackItems(items);
        setSelectedFeedback(items.length > 0 ? items[0] : null);
      }
      catch (err) {
        /* Save log to backend */
        await saveLogs(email_name, [{
          timestamp: new Date().toISOString(),
          email_name: email_name,
          navigateItem: navItems,
          event: "fetch_feedback_failed",
          error: err.message
        }]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  {/* reply box state and handler */}
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    setReplyText(selectedFeedback?.reply ?? "");
  }, [selectedFeedback]);

  const handleReplyFeedback = (index, status = null) => {
    const item = feedbackItems[index];
    if (!item) return;

    const defaultReply = statusToQuickText(status);

    const updated = { ...item, status, statusClass: statusToClass(status) };

    setRowStatus(index, status);
    setSelectedFeedback(updated);
    sendReply(defaultReply, status, index);
  };

  const sendReply = async (overrideText = null, markStatus = null, index = null) => {
    if (!selectedFeedback) return;

    const raw = overrideText ?? (replyText && replyText.trim() ? replyText : "");
    const text = (typeof raw === "string" ? raw : String(raw)).trim();

    /* if no text to send and no status set, return error */
    if (!text && !markStatus) return;

    try {
      await sendAdminReply(API_BASE_URL, {
        admin_email: email,
        user_email: selectedFeedback.name,
        timestamp: selectedFeedback.timestamp,
        replyText: text,
        status: markStatus
      });

      setReplyText(text);
      setFeedbackItems(prev => prev.map(it =>
        it.timestamp === selectedFeedback.timestamp
          ? { ...it, reply: text, status: markStatus ?? it.status, statusClass: markStatus ? statusToClass(markStatus) : it.statusClass }
          : it
      ));
      setSelectedFeedback(prev => prev ? { ...prev, reply: text, status: markStatus ?? prev.status, statusClass: markStatus ? statusToClass(markStatus) : prev.statusClass } : prev);

      if (markStatus) {
        if (typeof index === "number") {
          setRowStatus(index, markStatus);
        } else {
          const ts = selectedFeedback?.timestamp;
          if (ts) {
            setFeedbackItems(prev => {
              const copy = [...prev];
              const idx = copy.findIndex(it => it.timestamp === ts);
              if (idx !== -1) {
                copy[idx] = { ...copy[idx], status: markStatus, statusClass: statusToClass(markStatus) };
              }
              return copy;
            });
            setSelectedFeedback(prev => prev ? { ...prev, status: markStatus, statusClass: statusToClass(markStatus) } : prev);
          }
        }
      }

      /* Alert success */
      alert("Reply sent");
    }
    catch (err) {
      /* Alert error */
      alert("Failed to send reply");

      /* Save log to backend */
      await saveLogs(email_name, [{
        timestamp: new Date().toISOString(),
        email_name: email_name,
        navigateItem: navItems,
        event: "send_reply_failed",
        error: err.message
      }]);
    }
  };

  const setRowStatus = (index, newStatus) => {
    setFeedbackItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      item.status = newStatus;
      item.statusClass = statusToClass(newStatus);
      copy[index] = item;
      if (selectedFeedback && selectedFeedback.timestamp === item.timestamp) {
        setSelectedFeedback(item);
      }
      return copy;
    });
  };

  let avg_rating = 0;
  let total_rating = 0;
  let count_rating = 0;
  for (const item of feedbackItems) {
    total_rating += item['rating'] || 0;
    count_rating += item['rating'] ? 1 : 0;
  }
  avg_rating = count_rating > 0 ? total_rating / count_rating : 0;

  return (
    <div className="CommonGUI_Frame">
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <div className="header-tags">
            <span className="tag tag-green">
              <span className="dot dot-green"></span> {AdminGUI_describe.header.Title}
            </span>
            <span className="tag tag-orange">
              <span className="dot dot-orange"></span> {systemVersion ? `Version: ${systemVersion}` : "Loading version..."}
            </span>
          </div>
          <h1 className="dashboard-title">{AdminGUI_describe.DashboardTitle.MainTitle}</h1>
          <p className="dashboard-subtitle">{AdminGUI_describe.DashboardTitle.SubTitle}</p>
        </header>

        <div className="dashboard-main">
          <aside className="sidebar">
            <div className="user-profile">
              <span className="welcome-text">WELCOME!</span>
              <h2 className="user-name">{email_name}</h2>
              <span className="user-role">{AdminGUI_describe.role}</span>
            </div>

            <nav className="nav-menu">
              <button className="nav-item" onClick={() => onNavItemClick("menu_UserMonitor")}>
                <div className="nav-icon"></div>
                <span>{AdminGUI_describe.Navi_Menu.menu_UserMonitor}</span>
              </button>
              <button className={`nav-item ${navItems === "menu_Feedback" ? "active" : ""}`}>
                <div className="nav-icon"></div>
                <span>{AdminGUI_describe.Navi_Menu.menu_Feedback}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_Archive")}>
                <div className="nav-icon"></div>
                <span>{AdminGUI_describe.Navi_Menu.menu_Archive}</span>
              </button>
            </nav>

          </aside>

          <div className="user-area feedback-dashboard">
            <div className="content-col feedback-list-column">
              <section className="card review-card latest-feedback-card">
                <h2 className="panel-title feedback-section-title">{AdminGUI_describe.Feedback_Section.Title_1}</h2>
                <div className="feedback-table-head">
                  <span>{AdminGUI_describe.Feedback_Section.SubTitle_1}</span>
                  <span>{AdminGUI_describe.Feedback_Section.SubTitle_2}</span>
                  <span>{AdminGUI_describe.Feedback_Section.SubTitle_3}</span>
                  <span>{AdminGUI_describe.Feedback_Section.SubTitle_4}</span>
                  <span>{AdminGUI_describe.Feedback_Section.SubTitle_5}</span>
                  <span>{AdminGUI_describe.Feedback_Section.SubTitle_6}</span>
                </div>

                <div className="feedback-list">
                {feedbackItems.map((item, idx) => (
                  <article
                    key={`${item.name}-${item.rating}-${idx}`}
                    className={`feedback-row ${selectedFeedback === item ? "selected" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedFeedback(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedFeedback(item);
                    }}
                  >
                    <div className="feedback-user-cell">
                      <div className={`avatar ${item.avatarClass}`}>{item.avatar}</div>
                      <div className="feedback-user-meta">
                        <strong>{item.name}</strong>
                        <span>{item.date} {item.time}</span>
                      </div>
                    </div>

                    <div className="rating-badge">{item.rating}</div>

                    <div className={`pill type-pill ${item.typeClass}`}>{item.type}</div>

                    {item.attachmentUrl ? (
                      <button
                        type="button"
                        className="attachment-cell attachment-cell-clickable"
                        onClick={(e) => onAttachmentClick(e, item)}
                        title="Click to preview attachment"
                      >
                        <span className={`attachment-icon ${item.attachmentClass}`}>{paperclipIcon}</span>
                        <span className="attachment-name">{item.attachment}</span>
                      </button>
                    ) : (
                      <div className="attachment-cell">
                        <span className={`attachment-icon ${item.attachmentClass}`}>{paperclipIcon}</span>
                        <span className="attachment-name">{item.attachment}</span>
                      </div>
                    )}

                    <div className={`pill status-pill ${item.statusClass}`}>{item.status}</div>

                    <div className="action-stack" onClick={(e) => e.stopPropagation()}>
                      <div className="action-stack" onClick={(e) => e.stopPropagation()}>
                        <button className="action-btn action-analyze"
                          onClick={() => handleReplyFeedback(idx, "analyze")}>Analyze</button>

                        <button className="action-btn action-spam"
                          onClick={() => handleReplyFeedback(idx, "spam")}>Spam</button>

                        <button className="action-btn action-close"
                          onClick={() => handleReplyFeedback(idx, "close")}>Close</button>
                      </div>
                    </div>
                  </article>
                ))}
                </div>
              </section>
            </div>

            <div className="content-col feedback-side-column">
              <section className="card overview-card">
                <h2 className="panel-title">Operational Overview</h2>
                <div className="metrics-grid">
                  <div className="metric-card metric-green">
                    <span className="metric-label">{AdminGUI_describe.Metric_label.metric_1}</span>
                    <span className="metric-value">{avg_rating.toFixed(1)}</span>
                  </div>
                  <div className="metric-card metric-blue">
                    <span className="metric-label">{AdminGUI_describe.Metric_label.metric_2}</span>
                    <span className="metric-value">{feedbackItems.length}</span>
                  </div>
                </div>
              </section>

              <section className="card details-card">
                <h2 className="panel-title">Reply & Details</h2>

                {selectedFeedback ? (
                  <>
                    <div className="details-user">
                      <div className="details-user-meta">
                        <strong>{selectedFeedback.name}</strong>
                        <strong>{selectedFeedback.date} {selectedFeedback.time}</strong>
                      </div>
                      <div className="details-rating-box">
                        <span className="details-rating-label">Rating</span>
                        <span className="details-rating-value">{selectedFeedback.rating} / 10</span>
                      </div>
                    </div>

                    <div className="details-copy-scroll">
                      <p className="details-copy">
                        {selectedFeedback.feedbackText || "No content"}
                      </p>
                    </div>

                    <textarea
                      className="reply-box"
                      placeholder="Type your response here"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      className="send-reply-btn"
                      onClick={() => sendReply(null, "Replied")}
                      disabled={!replyText.trim()}
                    >
                      Send Reply
                    </button>
                  </>
                ) : (
                  <p className="details-copy">Select a feedback to view details.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {previewAttachment && (
        <div
          className="attachment-modal-overlay"
          onClick={closeAttachmentPreview}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="attachment-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="attachment-modal-header">
              <span className="attachment-modal-title">{previewAttachment.name}</span>
              <button
                type="button"
                className="attachment-modal-close"
                onClick={closeAttachmentPreview}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="attachment-modal-body">
              <img
                className="attachment-modal-image"
                src={previewAttachment.url}
                alt={previewAttachment.name}
                onError={(e) => {
                  e.currentTarget.replaceWith(
                    Object.assign(document.createElement("p"), {
                      className: "attachment-modal-error",
                      textContent: "Cannot load attachment.",
                    })
                  );
                }}
              />
            </div>
            <div className="attachment-modal-footer">
              <a
                className="attachment-modal-open"
                href={previewAttachment.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGUI_feedback;
