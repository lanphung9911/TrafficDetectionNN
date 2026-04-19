import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainGUI.css";
import MainGUI_describe from "./MainGUI_describe.json";
import { img_assets } from "../assets";
import { handleLogin } from "./login_handle";

export default function MainGUI() {
  const frames = Object.values(MainGUI_describe.MainGUI_describe.Feature);
  const [email, setEmail] = useState("");
  const [pwd, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  {/* on click login button */}
  const onLoginButtonClick = async () => {
    setLoginError("");
    if (!email || !pwd) {
      setLoginError("Please enter your email and password.");
      return;
    }
    if (!role) {
      setLoginError("Please select a role.");
      return;
    }
    try {
      localStorage.setItem("userEmail", email);
      navigate("/UserGUI_runtime");
      await handleLogin({ email, password: pwd, role });
      if (role === "DataScientist") {
        navigate("/UserGUI_runtime");
      } 
      else if (role === "Admin") {
        navigate("/UserGUI_runtime");
      } 
      else if (role === "User") {
        navigate("/UserGUI_runtime");
      }
    } catch (err) {
      setLoginError(err.message || "Login failed");
    }
  };

  

  return (
    <div className="MainGUI_Login">

      {/* ================= LEFT - INTRO ================= */}
      <div className="MainGUI_Frame-Introduce">
        <div className="MainGUI_Frame-Introduce_Text-title">
          {MainGUI_describe.MainGUI_describe.Title}
        </div>

        <div className="MainGUI_Frame-Introduce_Text-version">
          {MainGUI_describe.MainGUI_describe.Version}
        </div>

        <div className="MainGUI_Frame-Introduce_Text-description"
              style={{whiteSpace: "pre-line"}}>
          {MainGUI_describe.MainGUI_describe.ShortDescription}
        </div>

        {/* SMALL LEFT BOX 1 */}
        <div className="MainGUI_Frame-Introduce_Frame-1">
          <div className="MainGUI_Frame-Introduce_Frame-1_Text-1">
              {MainGUI_describe.MainGUI_describe.WhatNew.text_1}
          </div>
          <div className="MainGUI_Frame-Introduce_Frame-1_Text-2">
              {MainGUI_describe.MainGUI_describe.WhatNew.text_2}
          </div>
        </div>

        {/* SMALL LEFT BOX 2 */}
        <div className="MainGUI_Frame-Introduce_Frame-2">
          <div className="MainGUI_Frame-Introduce_Frame-2_Text-1">
            {MainGUI_describe.MainGUI_describe.WhatHot.text_1}
          </div>
          <div className="MainGUI_Frame-Introduce_Frame-2_Text-2">
            {MainGUI_describe.MainGUI_describe.WhatHot.text_2}
          </div>
        </div>

        {/* INFO BOX */}
        <div className="MainGUI_Frame-Introduce_Frame-Infor">
          {
            frames.map((f, i) => (
              <div key={i} className={`MainGUI_Frame-Introduce_Frame-Infor_Frame-${i+1}`}>
                <div className={`MainGUI_Frame-Introduce_Frame-Infor_Frame-${i+1}_Img-1`}>
                  <img src={img_assets[f.Image]} alt={f.Title} />
                </div>
                <div className={`MainGUI_Frame-Introduce_Frame-Infor_Frame-${i+1}_Text-1`}>
                  {f.Title}
                </div>
              </div>
            ))
          }
        </div>

        {/* CONTACT */}
        <div className="MainGUI_Frame-Introduce_Frame-Contact">
          <div className="MainGUI_Frame-Introduce_Frame-Contact_Text-1">
            {MainGUI_describe.MainGUI_describe.Contact.Email}
          </div>
          <div className="MainGUI_Frame-Introduce_Frame-Contact_Text-2">
            {MainGUI_describe.MainGUI_describe.Contact.GitHub}
          </div>
          <div className="MainGUI_Frame-Introduce_Frame-Contact_Text-3">
            {MainGUI_describe.MainGUI_describe.Contact.LinkedIn}
          </div>
        </div>

      </div>

      {/* ================= RIGHT - LOGIN ================= */}
      <div className="MainGUI_Frame-Login">
        <form
          onSubmit={(e) => { e.preventDefault(); onLoginButtonClick(); }}
          autoComplete="on"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "60px", width: "100%" }}
        >
        <div className="MainGUI_Frame-Login_Frame-UserAccess">
          {/* LOGIN TEXT */}
          <div className="MainGUI_Frame-Login_Frame-UserAccess_Text-1">
            LOG IN
            <br /> <br />
            to your account
          </div>

          {/* EMAIL */}
          <div className="MainGUI_Frame-Login_Frame-UserAccess_Frame-email">
            <div className="MainGUI_Frame-Login_Frame-UserAccess_Frame-email_Text-1">
              Email
            </div>
            <div className="MainGUI_Frame-Login_Frame-UserAccess_Frame-email_Box">
              <input 
                type="email"
                value={email}
                placeholder="Enter your email address"
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  color: "#122033",
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                }}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="MainGUI_Frame-Login_Frame-UserAccess_Frame-pw">
            <div className="MainGUI_Frame-Login_Frame-UserAccess_Frame-pw_Text-1">
              Password
            </div>

            <div className="MainGUI_Frame-Login_Frame-UserAccess_Frame-pw_Box">
              <input 
                type="password"
                value={pwd}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  color: "#122033",
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                }}
              />
            </div>
          </div>
        </div>

        {/* ROLE SECTION */}
        <div className="MainGUI_Frame-Login_Frame-Role">

          {/* BUTTON TO SELECT DATASCIENTIST ROLE */}
          <button
            type="button"
            className={`MainGUI_Frame-Login_Frame-Role_Frame-DS ${
              role === "DataScientist" ? "active" : ""
            }`}
            onClick={() => setRole(role !== "DataScientist" ? "DataScientist" : "")}
            style={{whiteSpace: "pre-line"}}>
            <p className="line-1">
              {MainGUI_describe.MainGUI_describe.Role.DataScientist.Main}
            </p>
            <p className="line-2">
              {MainGUI_describe.MainGUI_describe.Role.DataScientist.Sub}
            </p>
          </button>

          {/* BUTTON TO SELECT USER ROLE */}
          <button
            type="button"
            className={`MainGUI_Frame-Login_Frame-Role_Frame-User ${
              role === "User" ? "active" : ""
            }`}
            onClick={() => setRole(role !== "User" ? "User" : "")}
            style={{whiteSpace: "pre-line"}}>
            <p className="line-1">
              {MainGUI_describe.MainGUI_describe.Role.User.Main}
            </p>
            <p className="line-2">
              {MainGUI_describe.MainGUI_describe.Role.User.Sub}
            </p>
          </button>

          {/* BUTTON TO SELECT ADMIN ROLE */}
          <button
            type="button"
            className={`MainGUI_Frame-Login_Frame-Role_Frame-Ad ${
              role === "Admin" ? "active" : ""
            }`}
            onClick={() => setRole(role !== "Admin" ? "Admin" : "")}
            style={{whiteSpace: "pre-line"}}>
            <p className="line-1">
              {MainGUI_describe.MainGUI_describe.Role.Admin.Main}
            </p>
            <p className="line-2">
              {MainGUI_describe.MainGUI_describe.Role.Admin.Sub}
            </p>
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {loginError && (
          <div style={{ color: "red", fontSize: "13px", marginBottom: "8px", textAlign: "center" }}>
            {loginError}
          </div>
        )}

        {/* LOGIN BUTTON */}
        <button type="submit" className="MainGUI_Frame-Login_Frame-LoginButton">
          <div className="MainGUI_Frame-Login_Frame-LoginButton_Text-1">
            LOGIN
          </div>
        </button>

        </form>
      </div>
    </div>
  );
}
