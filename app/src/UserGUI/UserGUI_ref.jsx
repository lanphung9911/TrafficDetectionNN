import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './UserGUI_ref.css';
import UserGUI_describe from "./UserGUI_describe.json";
import { API_BASE_URL } from "../config";

const UserGUI_reference = () => {
  const navItems = "menu_Reference";
  const [refData, setRefData] = useState([]);
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail");
  const email_name = email ? email.split("@")[0] : "User";

  const onNavItemClick = (item) => {
    if (item === "menu_RunTime") {
      navigate("/UserGUI_runtime", "_blank");
    } else if (item === "menu_Static") {
      navigate("/UserGUI_static", "_blank");
    } else if (item === "menu_Reference") {
      /* Do nothing */
    } else if (item === "menu_Feedback") {
      navigate("/UserGUI_feedback", "_blank");
    } else {
      /* Do nothing */
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ref_data/get`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        console.log("Reference data loaded:", d);
        setRefData(Array.isArray(d) ? d : []);
      })
      .catch((e) => {
        console.error("Failed to load reference data:", e);
        setRefData([]);
      });
  }, []);

  const normalizeImageSrc = (imgPath) => {
    if (!imgPath) return "";
    if (/^https?:\/\//i.test(imgPath)) return imgPath;
    if (imgPath.startsWith("/")) return `${API_BASE_URL}${imgPath}`;
    const url = `${API_BASE_URL}/reference/${imgPath}`;
    console.log(`Image URL: ${url} (from: ${imgPath})`);
    return url;
  };

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(refData.length / itemsPerPage);

  const onNextImgClick = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      console.log(`Next page: ${currentPage + 1} / ${totalPages}`);
    }
  };

  const onPreviousImgClick = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      console.log(`Previous page: ${currentPage - 1} / ${totalPages}`);
    }
  };

  const onResetClick = () => {
    setCurrentPage(0);
    console.log("Reset to page 0");
  };

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = refData.slice(startIndex, endIndex);

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
              <button className={`nav-item `}
              onClick={() => onNavItemClick("menu_Static")}>
                <div className="nav-icon"></div>
                <span>{UserGUI_describe.UserGUI_describe.Navi_Menu.menu_Static}</span>
              </button>
              <button className={`nav-item ${navItems === "menu_Reference" ? "active" : ""}`}
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
              {/* Control settings */}
              <div className="control-settings">
              <div className="setting-row">
                <span className="setting-label">{UserGUI_describe.UserGUI_describe.Control_Panel.Title}</span>
                <div className="setting-options">
                  <button 
                    className="option-btn" 
                    onClick={() => onPreviousImgClick()}
                    disabled={currentPage === 0}
                    style={{ opacity: currentPage === 0 ? 0.5 : 1, cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {UserGUI_describe.UserGUI_describe.Control_Panel.Previous_Image}
                  </button>
                  <button className="option-btn" onClick={() => onNextImgClick()}
                    disabled={currentPage >= totalPages - 1}
                    style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1, cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    {UserGUI_describe.UserGUI_describe.Control_Panel.Next_Image}
                  </button>
                  <button className="option-btn" onClick={() => onResetClick()}>
                    {UserGUI_describe.UserGUI_describe.Control_Panel.reset}
                  </button>
                </div>
              </div>
              {refData.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  Page {currentPage + 1} / {totalPages} ({refData.length} total items)
                </div>
              )}
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="content-area">
            {/* Top Row */}
            <div className="ref-content-row">
              <div className="card reference-card">
                {currentPageData.map((item, index) => (
                  <div className="reference-item" key={`${item.img || "item"}-${startIndex + index}`}>
                    {item.img ? (
                      <img
                        className="reference-thumb"
                        src={normalizeImageSrc(item.img)}
                        alt={item.title || `ref-${startIndex + index + 1}`}
                      />
                    ) : (
                      <div className="reference-thumb placeholder"></div>
                    )}
                    <p className="reference-title">{item.title || "Unknown"}</p>
                    <p className="reference-desc">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
   </div>
  );
}

export default UserGUI_reference;