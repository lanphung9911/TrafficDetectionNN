/* import MainGUI */
import './MainGUI/MainGUI.css';
import './UserGUI/UserGUI.css';
import MainGUI from "./MainGUI/MainGUI";
import UserGUI_runtime from "./UserGUI/UserGUI_runtime";
import UserGUI_static from "./UserGUI/UserGUI_static";
import UserGUI_reference from "./UserGUI/UserGUI_ref";
import UserGUI_feedback from './UserGUI/UserGUI_feedback';

/* React Router */
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return ( 
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainGUI />} />
        <Route path="/UserGUI_runtime" element={<UserGUI_runtime />} />
        <Route path="/UserGUI_static" element={<UserGUI_static />} />
        <Route path="/UserGUI_reference" element={<UserGUI_reference />} />
        <Route path="/UserGUI_feedback" element={<UserGUI_feedback />} />
      </Routes>
    </BrowserRouter>
  );
};