import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminGUI_monitoring.css";
import AdminGUI_describe from "./AdminGUI_describe.json";
import { fetchUserInfo, deleteUser } from "./fetch_user";
import { getFeedbackDetails } from "./feedback_manage";
import { saveLogs } from "../utils/savelog";
import { API_BASE_URL } from "../config";
import { fetchAnalysisLogs } from "./auditlog_manage";
import { getSystemVersion } from "../utils/get_system_version";

const AdminGUI_monitoring = () => {
  const navItems = "menu_UserMonitor";
  const email = localStorage.getItem("loginEmail");
  const email_name = email ? email.split("@")[0] : "Admin";
  const navigate = useNavigate();

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

  useEffect(() => {
    if (systemVersion === null || systemVersion === undefined) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetchAnalysisLogs(systemVersion);
        if (!mounted) return;
        setAuditLogs(res.audit_logs);
        setAuditPage(0);
      } catch (err) {
        console.error("fetchAnalysisLogs failed:", err);
      }
    })();
    return () => { mounted = false; };
  }, [systemVersion]);

  {/* items selected in navigation menu, default is "menu_UserMonitor" */}
  const onNavItemClick = (item) => {
    if (item === "menu_UserMonitor") {
      /* Do nothing */
    } else if (item === "menu_Feedback") {
      navigate("/AdminGUI_feedback", "_blank");
    } else if (item === "menu_Archive") {
      navigate("/AdminGUI_archive", "_blank");
    } else {
      /* Do nothing */
    }
  };

  {/* fetch user info from backend when component is mounted */}
  const [userInfo, setUserInfo] = useState(null);
    useEffect(() => {
    const fetchData = async () => {
      try {
        const list_user = await fetchUserInfo();
        setUserInfo(list_user);
      } 
      catch (err) {
        await saveLogs(email_name, [{
          timestamp: new Date().toISOString(),
          email_name: email_name,
          navigateItem: navItems,
          event: "fetch_user_info_failed",
          error: err.message
        }]);
      }
    };
    fetchData();
  }, []);

  {/* mock user data, will be replaced by real data from backend */}
  const usersList = Array.isArray(userInfo) && userInfo.length > 0 ? userInfo : [];

  {/* pagination for user list */}
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(usersList.length / pageSize));
  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [usersList.length, totalPages, page]);

  {/* Handle delete user action, call backend API to delete user and update UI */}
  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    const prev = Array.isArray(userInfo) ? [...userInfo] : [];
    setUserInfo(prev.filter(u => u.email !== email));

    try {
      await deleteUser(email);
      alert(`User ${email} deleted successfully.`); /* Alert on success */
    } 
    catch (err) {
      setUserInfo(prev); /* Rollback on failure */
      alert("Delete failed: " + (err.message || "Unknown error")); /* Alert on failure */
      /* Save logs to backend */
      await saveLogs(email_name, [{
        timestamp: new Date().toISOString(),
        email_name: email_name,
        navigateItem: navItems,
        event: "delete_user_failed",
        error: err.message
      }]);
    }
  };

  {/* Handle analyze log action, call backend API to analyze log and update UI */}
  const [feedbackDetails, setFeedbackDetails] = useState(null);
  const handleAnalyzeLog = async (user_email) => {
    try {
      const details = await getFeedbackDetails(API_BASE_URL, user_email);
      if (details && details.logs) {
        const parsedLogs = JSON.parse(details.logs);
        setFeedbackDetails(parsedLogs);
      } else {
        setFeedbackDetails(null);
      }
    }
    catch (err) {
      setFeedbackDetails(null);

      /* Alert on failure */
      alert("Fetch logs failed: " + (err.message || "Unknown error"));

      /* Save logs to backend */
      await saveLogs(email_name, [{
        timestamp: new Date().toISOString(),
        email_name: email_name,
        navigateItem: navItems,
        event: "fetch_logs_failed",
        error: err.message
      }]);
    }
  };

  {/* handle page of audit logs */}
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(0);
  const auditPageSize = 3;
  const auditTotalPages = Math.max(1, Math.ceil(auditLogs.length / auditPageSize));

  const snapshots = [
    { label: AdminGUI_describe.Snapshot.Title_1, 
      value: systemVersion || "N/A", 
      note: "stable release", 
      badgeClass: "snapshot-gray" },
    { label: AdminGUI_describe.Snapshot.Title_2, 
      value: "thresholds.json", 
      note: "last sync 08:00", 
      badgeClass: "snapshot-cyan" },
    { label: AdminGUI_describe.Snapshot.Title_3, 
      value: "12 users", 
      note: "7 active today", 
      badgeClass: "snapshot-violet" },
    { label: AdminGUI_describe.Snapshot.Title_4, 
      value: "PDF + CSV", 
      note: "2 scheduled", 
      badgeClass: "snapshot-peach" },
  ];

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
              <button
                className={`nav-item ${navItems === "menu_UserMonitor" ? "active" : ""}`}
                onClick={() => onNavItemClick("menu_UserMonitor")}
              >
                <div className="nav-icon"></div>
                <span>{AdminGUI_describe.Navi_Menu.menu_UserMonitor}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_Feedback")}>
                <div className="nav-icon"></div>
                <span>{AdminGUI_describe.Navi_Menu.menu_Feedback}</span>
              </button>
              <button className="nav-item" onClick={() => onNavItemClick("menu_Archive")}>
                <div className="nav-icon"></div>
                <span>{AdminGUI_describe.Navi_Menu.menu_Archive}</span>
              </button>
            </nav>
          </aside>

          <div className="monitor-area">
            <div className="monitor-top-row">
              <section className="card monitor-card permissions-card">
                <div className="monitor-card-head">
                  <div>
                    <h2 className="monitor-title">{AdminGUI_describe.Monitor_label.Title_1}</h2>
                    <p className="monitor-subtitle">{AdminGUI_describe.Monitor_label.SubTitle_1}</p>
                  </div>
                </div>

                <div className="monitor-table-head permissions-grid">
                  <span>Email</span>
                  <span>Role</span>
                  <span>Permission</span>
                  <span>Action</span>
                  <span>Logs</span>
                </div>

                <div className="permissions-list">
                  {usersList
                    .slice(page * pageSize, (page + 1) * pageSize)
                    .map((user, idx) => (
                      <div
                        className="permissions-row permissions-grid"
                        key={`${user.email ?? 'user'}-${page}-${idx}`}
                      >
                        <div className="user-name-cell">{user.email.split("@")[0] ?? "--"}</div>
                        <div className="user-role-cell">{user.role ?? "--"}</div>
                        <div className="user-permission-cell">{user.permission ?? "--"}</div>
                        <button className="monitor-ghost-btn"
                          onClick={() => handleDeleteUser(user.email.split("@")[0])}> Delete
                        </button>
                        <button className="monitor-ghost-btn"
                          onClick={() => handleAnalyzeLog(user.email.split("@")[0])}> Logs
                        </button>
                      </div>
                    ))}
                </div>

                <div className="monitor-footer">
                  <span>
                    Showing {Math.min(usersList.length, (page + 1) * pageSize)} of {usersList.length} users
                  </span>
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      ‹
                    </button>
                    <span>{page + 1}/{totalPages}</span>
                    <button
                      className="page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </section>

              <section className="card monitor-card feedback-details-card">
                <h2 className="monitor-title">Feedback Details</h2>
                <p className="monitor-subtitle">Logs for selected user</p>

                {feedbackDetails ? (
                  <div className="feedback-details-container">
                    <pre className="feedback-details-content">
                      {JSON.stringify(feedbackDetails, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p>No feedback details available. Select a user to view logs.</p>
                )}
              </section>
            </div>

            <section className="card monitor-card audit-card">
              <h2 className="monitor-title">{AdminGUI_describe.Monitor_label.Title_3}</h2>
              <p className="monitor-subtitle">{AdminGUI_describe.Monitor_label.SubTitle_3}</p>

              <div className="audit-list">
                {auditLogs.length === 0 ? (
                  <div className="audit-row">No audit logs for this version.</div>
                ) : (
                  auditLogs
                    .slice(auditPage * auditPageSize, (auditPage + 1) * auditPageSize)
                    .map((log, idx) => (
                      <div className="audit-row" key={`${auditPage}-${idx}`}>
                        <div>
                          {(log.time_stamp ?? log.timestamp ?? "—").replace?.("T", " ").split?.(".")[0]}
                        </div>
                        <div>
                          {log.email_name ?? log.email ?? "—"}
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {log.changes ?? log.change ?? (typeof log === "object" ? JSON.stringify(log) : String(log))}
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="monitor-footer">
                <span>
                  Showing {Math.min(auditLogs.length, (auditPage + 1) * auditPageSize)} of {auditLogs.length} events
                </span>
                <div className="pagination">
                  <button className="page-btn" onClick={() => setAuditPage(p => Math.max(0, p - 1))} disabled={auditPage === 0}>‹</button>
                  <span>{auditPage + 1}/{auditTotalPages}</span>
                  <button className="page-btn" onClick={() => setAuditPage(p => Math.min(auditTotalPages - 1, p + 1))} disabled={auditPage >= auditTotalPages - 1}>›</button>
                </div>
              </div>
            </section>

            <section className="card monitor-card snapshot-card">
              <h2 className="monitor-title">{AdminGUI_describe.Monitor_label.Title_4}</h2>
              <p className="monitor-subtitle">
                {AdminGUI_describe.Monitor_label.SubTitle_4}
              </p>

              <div className="snapshot-grid">
                {snapshots.map((item) => (
                  <div className={`snapshot-item ${item.badgeClass}`} key={item.label}>
                    <span className="snapshot-label">{item.label}</span>
                    <strong className="snapshot-value">{item.value}</strong>
                    <span className="snapshot-note">{item.note}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGUI_monitoring;
