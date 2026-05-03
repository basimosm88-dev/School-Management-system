// System Version: 1.3.0 - Production Sync & Infrastructure Update
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
 <StrictMode>
 <App />
 </StrictMode>,
)
