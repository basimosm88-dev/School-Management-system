// System Version: 1.3.4 - CSS Compatibility & Icon Rendering Fixes
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
 <StrictMode>
 <App />
 </StrictMode>,
)
