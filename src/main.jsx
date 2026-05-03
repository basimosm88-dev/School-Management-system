// System Version: 1.3.2 - UI Refinements & Linter Fixes
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
 <StrictMode>
 <App />
 </StrictMode>,
)
