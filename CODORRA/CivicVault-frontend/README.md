# CivicVault

> **Your Data, Your Control.** A unified platform for citizens to manage their digital footprint and for government bodies to securely request access to documents.

![CivicVault](https://img.shields.io/badge/Status-Active_Development-success)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)

CivicVault is a modern, dual-sided React application designed to bridge the gap between citizen data privacy and government administrative needs. It features a seamless authentication flow that routes users to dedicated dashboards based on their role.

---

## Key Features

### Citizen Portal (`/vault`)
- **Document Vault:** Upload, view, and delete documents categorized by Bank and Government.
- **Access Control:** Grant or revoke access to specific documents with a single click.
- **Request Management:** Approve or deny incoming access requests from government bodies.
- **Social Media Hub:** Link, activate, deactivate, or delete social media accounts.
- **Activity Log:** Track exactly who accessed what, and when, keeping a transparent audit trail.
- **Emergency Stop:** A panic button that instantly revokes all document access and deactivates all linked social media accounts.

### Government Portal (`/gov`)
- **Citizen Directory:** Search for citizens by name, UID, or city.
- **Data Insights:** View a dashboard of a citizen's accessible documents, locked documents, and social presence.
- **Access Requests:** Formally request access to locked citizen documents (triggers a pending request on the citizen's end).

### Role-Based Authentication (`/`)
- A unified login/signup page that dynamically switches UI based on whether the user is a Citizen or a Government Body.
- Seamless redirection to the appropriate dashboard using React Router.

---

## Technology Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v7 (`react-router-dom`)
- **Styling:** Vanilla CSS & Inline styles with a custom modern design system (DM Sans font, glassmorphism elements, micro-animations).

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository** (or download the source code):
   ```bash
   git clone https://github.com/Pookiee-coder/CivicVault.git
   cd civicvault-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **View the app**:
   Open your browser and navigate to `http://localhost:5173/`

---

## Project Structure

```text
civicvault-app/
├── public/
├── src/
│   ├── App.jsx                # The Citizen Portal Dashboard
│   ├── GovernmentPortal.jsx   # The Government Body Dashboard
│   ├── AuthPage.jsx           # Unified Login/Signup Page with role selection
│   ├── main.jsx               # React Entry point & Router configuration
│   ├── index.css              # Global styles & resets
│   └── App.css                # Component-specific styles
├── package.json
└── README.md
```

---

## Design Philosophy

CivicVault is built with a premium, user-first aesthetic. It utilizes:
- **DM Sans** for clean, legible, and modern typography.
- A balanced palette of deep slates (`#0f172a`), soft backgrounds (`#f8fafc`), and vibrant semantic colors (Green for success/access, Red for danger/revoke).
- Fluid micro-animations and hover effects to make the interface feel responsive and alive.

---

*Developed for the CivicVault project.*

