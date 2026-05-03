// System Version: 1.3.1 - Mandatory Field Enforcement & Data Integrity
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
 <StrictMode>
 <App />
 </StrictMode>,
)
