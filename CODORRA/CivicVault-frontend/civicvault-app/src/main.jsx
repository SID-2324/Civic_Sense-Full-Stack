import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import AuthPage from './AuthPage.jsx'
import CivicVault from './App.jsx'
import GovPortal from './GovernmentPortal.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/vault" element={<CivicVault />} />
        <Route path="/gov" element={<GovPortal />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
