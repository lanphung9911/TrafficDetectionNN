/* import MainGUI */
import './commonGUI.css';
import './MainGUI/MainGUI.css';
import './UserGUI/UserGUI.css';
import './AdminGUI/AdminGUI.css';
import './DataScientistGUI/DataScientistGUI.css';

/* import GUI components */
import MainGUI from "./MainGUI/MainGUI";
import UserGUI_static from "./UserGUI/UserGUI_static";
import UserGUI_reference from "./UserGUI/UserGUI_ref";
import UserGUI_feedback from './UserGUI/UserGUI_feedback';
import AdminGUI_feedback from './AdminGUI/AdminGUI_feedback';
import AdminGUI_archive from './AdminGUI/AdminGUI_archive';
import AdminGUI_monitoring from './AdminGUI/AdminGUI_monitoring';
import DataScientistGUI_history from './DataScientistGUI/DataScientistGUI_history';
import DataScientistGUI_evaluation from './DataScientistGUI/DataScientistGUI_evaluation';
import DataScientistGUI_TrainPipeline from './DataScientistGUI/DataScientistGUI_TrainPipeline';
import DataScientistGUI_Dataset from './DataScientistGUI/DataScientistGUI_Dataset';

/* Training Context Provider */
import { TrainingProvider } from './DataScientistGUI/TrainingContext';

/* React Router */
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return ( 
    <BrowserRouter>
      <TrainingProvider>
        <Routes>
          <Route path="/" element={<MainGUI />} />
            <Route path="/UserGUI_static" element={<UserGUI_static />} />
          <Route path="/UserGUI_reference" element={<UserGUI_reference />} />
          <Route path="/UserGUI_feedback" element={<UserGUI_feedback />} />
          <Route path="/AdminGUI_feedback" element={<AdminGUI_feedback />} />
          <Route path="/AdminGUI_archive" element={<AdminGUI_archive />} />
          <Route path="/AdminGUI_monitoring" element={<AdminGUI_monitoring />} />
          <Route path="/DataScientistGUI_history" element={<DataScientistGUI_history />} />
          <Route path="/DataScientistGUI_evaluation" element={<DataScientistGUI_evaluation />} />
          <Route path="/DataScientistGUI_TrainPipeline" element={<DataScientistGUI_TrainPipeline />} />
          <Route path="/DataScientistGUI_Dataset" element={<DataScientistGUI_Dataset />} />
        </Routes>
      </TrainingProvider>
    </BrowserRouter>
  );
};