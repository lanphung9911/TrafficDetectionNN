import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App_main from './App_main'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App_main />
  </StrictMode>,
)
