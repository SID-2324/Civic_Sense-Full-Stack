import { useEffect, useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const initialDocs = {
  bank: [
    { id: "b1", name: "HDFC Bank Statement", period: "Apr 2025 – Mar 2026", size: "2.1 MB", accessGranted: false, lastAccessed: null, requests: [{ by: "Income Tax Dept.", date: "12 May 2026", status: "pending" }] },
    { id: "b2", name: "SBI Savings Account", period: "Jan – Mar 2026", size: "890 KB", accessGranted: true, lastAccessed: "28 Apr 2026", requests: [] },
    { id: "b3", name: "Fixed Deposit Certificate", period: "FY 2025–26", size: "340 KB", accessGranted: false, lastAccessed: null, requests: [] },
  ],
  govt: [
    { id: "g1", name: "Aadhaar Card", issuer: "UIDAI", size: "1.2 MB", accessGranted: false, lastAccessed: null, requests: [{ by: "Mumbai Municipal Corp.", date: "20 May 2026", status: "pending" }] },
    { id: "g2", name: "PAN Card", issuer: "Income Tax Dept.", size: "560 KB", accessGranted: true, lastAccessed: "15 May 2026", requests: [] },
    { id: "g3", name: "Passport", issuer: "Ministry of External Affairs", size: "3.8 MB", accessGranted: false, lastAccessed: null, requests: [] },
    { id: "g4", name: "Voter ID", issuer: "Election Commission of India", size: "720 KB", accessGranted: false, lastAccessed: null, requests: [{ by: "State Election Office", date: "02 May 2026", status: "pending" }] },
  ],
};

// -----------------------------------------------------------------------------
// --- SOCIAL MEDIA ADDITION: Accounts Data ---
// -----------------------------------------------------------------------------
const initialSocial = [
  { id: "s1", name: "Instagram", handle: "@username", active: true, linkedSince: "Jan 2023" },
  { id: "s2", name: "Twitter / X", handle: "@username", active: false, linkedSince: "Mar 2022" },
  { id: "s3", name: "LinkedIn", handle: "linkedin.com/in/username", active: true, linkedSince: "Jun 2021" },
  { id: "s4", name: "Facebook", handle: "facebook.com/username", active: false, linkedSince: "Aug 2020" },
  { id: "s5", name: "YouTube", handle: "@username", active: true, linkedSince: "Nov 2022" },
];

// -----------------------------------------------------------------------------
// --- SOCIAL MEDIA ADDITION: Added "social" tab ---
// -----------------------------------------------------------------------------
const tabs = [
  { id: "bank", label: "Bank Statements" },
  { id: "govt", label: "Gov. Documents" },
  { id: "social", label: "Social Media" },
  { id: "activity", label: "Access Log" },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const SESSION_KEY = "civicvault-session";

function getSessionProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getDemoHeaders() {
  const session = getSessionProfile();
  return {
    "x-demo-user-id": session?.id || import.meta.env.VITE_DEMO_USER_ID || "9764b712-eaf7-4836-895f-d5a4348b2bb5",
    "x-demo-user-email": session?.email || import.meta.env.VITE_DEMO_USER_EMAIL || "demo@civicvault.local",
    "x-demo-user-name": session?.name || import.meta.env.VITE_DEMO_USER_NAME || "CivicVault Demo",
    "x-demo-role": session?.role || import.meta.env.VITE_DEMO_ROLE || "user",
    ...(session?.government_id ? { "x-demo-government-id": session.government_id } : {}),
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getDemoHeaders(),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function AccessToggle({ granted, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "6px 14px", borderRadius: "999px",
      border: `1.5px solid ${granted ? "#22c55e" : "#e2e8f0"}`,
      background: granted ? "#f0fdf4" : "#f8fafc",
      color: granted ? "#16a34a" : "#94a3b8",
      fontSize: "12px", fontWeight: 600, cursor: "pointer",
      transition: "all 0.2s", fontFamily: "inherit", letterSpacing: "0.04em",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: granted ? "#22c55e" : "#cbd5e1", display: "inline-block" }} />
      {granted ? "ACCESS OPEN" : "ACCESS CLOSED"}
    </button>
  );
}

function btnStyle(color, bg, border) {
  return { padding: "5px 14px", borderRadius: "8px", border: `1.5px solid ${border}`, background: bg, color, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
}

// ─── DOC CARD ────────────────────────────────────────────────────────────────

function DocCard({ doc, onToggle, onApprove, onDeny, onDelete }) {
  const pendingReqs = doc.requests.filter(r => r.status === "pending");
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: doc.userUploaded ? "1.5px solid #fca5a5" : "1.5px solid #f1f5f9", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 1px 6px rgba(15,23,42,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "15px" }}>{doc.name}</div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: 2 }}>{doc.period || doc.issuer} · {doc.size}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <AccessToggle granted={doc.accessGranted} onToggle={onToggle} />
          <button onClick={onDelete} style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #fca5a5", background: "#fff1f2", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
        </div>
      </div>
      {doc.lastAccessed && (
        <div style={{ fontSize: "12px", color: "#64748b", background: "#f8fafc", borderRadius: "8px", padding: "6px 10px" }}>
          Last accessed: {doc.lastAccessed}
        </div>
      )}
      {pendingReqs.length > 0 && (
        <div style={{ borderRadius: "10px", border: "1.5px solid #fde68a", background: "#fffbeb", padding: "12px 14px" }}>
          {pendingReqs.map((req, i) => (
            <div key={i}>
              <div style={{ fontSize: "12px", color: "#92400e", fontWeight: 600, marginBottom: 8 }}>Access Request — {req.by}</div>
              <div style={{ fontSize: "11px", color: "#a16207", marginBottom: 10 }}>Requested on {req.date}</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => onApprove(req)} style={btnStyle("#16a34a", "#f0fdf4", "#bbf7d0")}>Approve</button>
                <button onClick={() => onDeny(req)} style={btnStyle("#dc2626", "#fff1f2", "#fecaca")}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// --- SOCIAL MEDIA ADDITION: Social Media Card ---
// -----------------------------------------------------------------------------
function SocialCard({ account, onToggle, onDelete }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "16px",
      border: "1.5px solid #f1f5f9",
      padding: "20px 22px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
    }}>
      {/* Left: account info */}
      <div>
        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "15px" }}>{account.name}</div>
        <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: 2 }}>
          {account.handle} · Linked since {account.linkedSince}
        </div>
      </div>

      {/* Right: status + toggle + delete */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Active / Inactive pill */}
        <span style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
          padding: "4px 10px", borderRadius: "999px",
          background: account.active ? "#f0fdf4" : "#f8fafc",
          color: account.active ? "#16a34a" : "#94a3b8",
          border: `1.5px solid ${account.active ? "#bbf7d0" : "#e2e8f0"}`,
        }}>
          {account.active ? "ACTIVE" : "INACTIVE"}
        </span>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          style={{
            padding: "6px 14px", borderRadius: "8px", fontWeight: 700,
            fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
            border: account.active ? "1.5px solid #fde68a" : "1.5px solid #bbf7d0",
            background: account.active ? "#fffbeb" : "#f0fdf4",
            color: account.active ? "#92400e" : "#16a34a",
          }}
        >
          {account.active ? "Deactivate" : "Activate"}
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          style={{
            padding: "6px 12px", borderRadius: "8px",
            border: "1.5px solid #fca5a5", background: "#fff1f2",
            color: "#dc2626", fontSize: "12px", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// --- SOCIAL MEDIA ADDITION: Social Media Section ---
// -----------------------------------------------------------------------------
function SocialSection({ accounts, onToggle, onDelete, onAdd }) {
  const [form, setForm] = useState({ name: "", handle: "" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd({ name: form.name.trim(), handle: form.handle.trim() || "—" });
    setForm({ name: "", handle: "" });
  };

  const activeCount = accounts.filter(a => a.active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Summary bar */}
      <div style={{
        background: "#fff", borderRadius: "12px",
        border: "1.5px solid #f1f5f9", padding: "14px 20px",
        display: "flex", gap: 20,
      }}>
        <div style={{ fontSize: "13px", color: "#64748b" }}>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{accounts.length}</span> accounts linked
        </div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>
          <span style={{ fontWeight: 700, color: "#22c55e" }}>{activeCount}</span> active
        </div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>
          <span style={{ fontWeight: 700, color: "#94a3b8" }}>{accounts.length - activeCount}</span> inactive
        </div>
      </div>

      {/* Account cards */}
      {accounts.map(acc => (
        <SocialCard
          key={acc.id}
          account={acc}
          onToggle={() => onToggle(acc.id)}
          onDelete={() => onDelete(acc.id)}
        />
      ))}

      {/* Add new account inline form */}
      <div style={{
        background: "#fff", borderRadius: "16px",
        border: "1.5px dashed #cbd5e1", padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        <div style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>Link a new account</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Platform (e.g. Snapchat)"
            style={{ flex: 1, padding: "9px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#0f172a" }}
          />
          <input
            value={form.handle}
            onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
            placeholder="Handle (e.g. @username)"
            style={{ flex: 1, padding: "9px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#0f172a" }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: "9px 18px", borderRadius: "10px",
              border: "none", background: "#0f172a",
              color: "#fff", fontWeight: 700, fontSize: "13px",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

function ActivityLog({ docs, social }) {
  const allEvents = [];
  Object.entries(docs).forEach(([, list]) => {
    list.forEach(doc => {
      if (doc.lastAccessed) allEvents.push({ name: doc.name, action: "Accessed", date: doc.lastAccessed, color: "#3b82f6" });
      doc.requests.forEach(r => {
        allEvents.push({ name: doc.name, action: r.status === "pending" ? `Request by ${r.by}` : `${r.status} — ${r.by}`, date: r.date, color: r.status === "pending" ? "#f59e0b" : r.status === "approved" ? "#22c55e" : "#ef4444" });
      });
    });
  });
  // -----------------------------------------------------------------------------
  // --- SOCIAL MEDIA ADDITION: Include social events in activity log ---
  // -----------------------------------------------------------------------------
  social.forEach(acc => {
    allEvents.push({ name: acc.name, action: acc.active ? "Account Active" : "Account Inactive", date: `Linked ${acc.linkedSince}`, color: acc.active ? "#22c55e" : "#94a3b8" });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {allEvents.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: "14px" }}>No activity yet.</div>
      ) : allEvents.map((e, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: "12px", border: "1.5px solid #f1f5f9", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{e.name}</div>
            <div style={{ fontSize: "12px", color: e.color, marginTop: 2, fontWeight: 600 }}>{e.action}</div>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{e.date}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function CivicVault() {
  const [activeTab, setActiveTab] = useState("bank");
  const [docs, setDocs] = useState(initialDocs);
  // -----------------------------------------------------------------------------
  // --- SOCIAL MEDIA ADDITION: Social State ---
  // -----------------------------------------------------------------------------
  const [social, setSocial] = useState(initialSocial);
  const [toast, setToast] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", meta: "", size: "" });

  const showToast = (msg, color = "#22c55e") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const result = await apiRequest("/civicvault/dashboard");
        if (!active) return;
        setDocs(result.dashboard.sections);
        setSocial(result.dashboard.social ?? initialSocial);
      } catch (error) {
        if (!active) return;
        showToast(error instanceof Error ? error.message : "Backend unavailable, using local state", "#dc2626");
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const commitDashboard = (dashboard) => {
    setDocs(dashboard.sections);
    if (dashboard.social) {
      setSocial(dashboard.social);
    }
  };

  const emergencyStop = async () => {
    try {
      const result = await apiRequest("/civicvault/emergency/stop", { method: "POST" });
      commitDashboard(result.dashboard);
      showToast("All access revoked — Emergency Stop activated", "#dc2626");
    } catch (error) {
      setDocs(prev => {
        const updated = {};
        Object.entries(prev).forEach(([s, list]) => { updated[s] = list.map(d => ({ ...d, accessGranted: false })); });
        return updated;
      });
      setSocial(prev => prev.map(a => ({ ...a, active: false })));
      showToast(error instanceof Error ? error.message : "Emergency stop applied locally", "#dc2626");
    } finally {
      setShowWarning(false);
    }
  };

  const toggleAccess = async (section, id) => {
    const doc = docs[section].find(d => d.id === id);

    try {
      const result = await apiRequest(`/civicvault/documents/${section}/${id}/access`, { method: "PATCH" });
      commitDashboard(result.dashboard);
      showToast(doc.accessGranted ? `Access revoked for ${doc.name}` : `Access granted for ${doc.name}`, doc.accessGranted ? "#ef4444" : "#22c55e");
    } catch (error) {
      setDocs(prev => ({ ...prev, [section]: prev[section].map(d => d.id === id ? { ...d, accessGranted: !d.accessGranted } : d) }));
      showToast(error instanceof Error ? error.message : "Access updated locally", doc.accessGranted ? "#ef4444" : "#22c55e");
    }
  };

  // -----------------------------------------------------------------------------
  // --- SOCIAL MEDIA ADDITION: Toggle social account ---
  // -----------------------------------------------------------------------------
  const toggleSocial = async (id) => {
    const acc = social.find(a => a.id === id);

    try {
      const result = await apiRequest(`/civicvault/social/${id}/toggle`, { method: "PATCH" });
      commitDashboard(result.dashboard);
      showToast(acc.active ? `${acc.name} deactivated` : `${acc.name} activated`, acc.active ? "#ef4444" : "#22c55e");
    } catch (error) {
      setSocial(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
      showToast(error instanceof Error ? error.message : "Social account updated locally", acc.active ? "#ef4444" : "#22c55e");
    }
  };

  // -----------------------------------------------------------------------------
  // --- SOCIAL MEDIA ADDITION: Delete social account ---
  // -----------------------------------------------------------------------------
  const deleteSocial = async (id) => {
    const acc = social.find(a => a.id === id);

    try {
      const result = await apiRequest(`/civicvault/social/${id}`, { method: "DELETE" });
      commitDashboard(result.dashboard);
      showToast(`${acc.name} removed`, "#64748b");
    } catch (error) {
      setSocial(prev => prev.filter(a => a.id !== id));
      showToast(error instanceof Error ? error.message : "Social account removed locally", "#64748b");
    }
  };

  // -----------------------------------------------------------------------------
  // --- SOCIAL MEDIA ADDITION: Add a social account ---
  // -----------------------------------------------------------------------------
  const addSocial = async ({ name, handle }) => {
    try {
      const result = await apiRequest("/civicvault/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, handle })
      });
      commitDashboard(result.dashboard);
      showToast(`${name} linked`);
    } catch (error) {
      setSocial(prev => [...prev, { id: `s-${Date.now()}`, name, handle, active: false, linkedSince: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }) }]);
      showToast(error instanceof Error ? error.message : "Social account linked locally");
    }
  };

  const uploadDoc = () => {
    if (!uploadForm.name.trim()) return;
    const newDoc = { id: `u-${Date.now()}`, name: uploadForm.name.trim(), [activeTab === "bank" ? "period" : "issuer"]: uploadForm.meta.trim() || "—", size: uploadForm.size.trim() || "—", accessGranted: false, lastAccessed: null, requests: [], userUploaded: true };
    setDocs(prev => ({ ...prev, [activeTab]: [...prev[activeTab], newDoc] }));
    setUploadForm({ name: "", meta: "", size: "" });
    setShowUpload(false);
    showToast(`"${newDoc.name}" uploaded successfully`);
  };

  const deleteDoc = (section, id) => {
    const doc = docs[section].find(d => d.id === id);
    setDocs(prev => ({ ...prev, [section]: prev[section].filter(d => d.id !== id) }));
    showToast(`"${doc.name}" deleted`, "#64748b");
  };

  const handleRequest = (section, docId, req, approved) => {
    setDocs(prev => ({ ...prev, [section]: prev[section].map(d => d.id === docId ? { ...d, accessGranted: approved ? true : d.accessGranted, requests: d.requests.map(r => r === req ? { ...r, status: approved ? "approved" : "denied" } : r) } : d) }));
    showToast(approved ? "Request approved" : "Request denied", approved ? "#22c55e" : "#ef4444");
  };

  const totalDocs = Object.values(docs).flat().length;
  const openDocs = Object.values(docs).flat().filter(d => d.accessGranted).length;
  const pendingCount = Object.values(docs).flat().flatMap(d => d.requests).filter(r => r.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px 28px", maxWidth: 400, width: "90%", boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#0f172a", marginBottom: 4 }}>Upload Document</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 20 }}>Adding to: <strong>{activeTab === "bank" ? "Bank Statements" : "Gov. Documents"}</strong></div>
            {[
              { label: "Document Name *", key: "name", placeholder: "e.g. ICICI Bank Statement" },
              { label: activeTab === "bank" ? "Period" : "Issuer", key: "meta", placeholder: activeTab === "bank" ? "e.g. Jan – Mar 2026" : "e.g. UIDAI" },
              { label: "File Size", key: "size", placeholder: "e.g. 1.2 MB" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 5 }}>{field.label}</div>
                <input value={uploadForm[field.key]} onChange={e => setUploadForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#0f172a", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => { setShowUpload(false); setUploadForm({ name: "", meta: "", size: "" }); }} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={uploadDoc} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", animation: "fadeIn 0.15s ease" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px 28px", maxWidth: 380, width: "90%", boxShadow: "0 24px 60px rgba(15,23,42,0.2)", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "18px", color: "#dc2626", marginBottom: 8 }}>Emergency Stop</div>
            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              This will <strong>immediately revoke all document access</strong> and <strong>deactivate all social media accounts</strong> across every section.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowWarning(false)} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={emergencyStop} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(220,38,38,0.35)" }}>Revoke All</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000, background: toast.color, color: "#fff", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadeIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #f1f5f9", padding: "0 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.03em" }}>CivicVault</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Data, Your Control</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StatPill label="Docs" value={totalDocs} color="#64748b" />
              <StatPill label="Open" value={openDocs} color="#22c55e" />
              {/* ----------------------------------------------------------------------------- */}
              {/* --- SOCIAL MEDIA ADDITION: Social active count in header --- */}
              {/* ----------------------------------------------------------------------------- */}
              <StatPill label="Social Active" value={social.filter(a => a.active).length} color="#6366f1" />
              {pendingCount > 0 && <StatPill label="Requests" value={pendingCount} color="#f59e0b" />}
              <button onClick={() => setShowWarning(true)} style={{ padding: "6px 14px", borderRadius: "999px", border: "1.5px solid #fca5a5", background: "#fff1f2", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.03em" }}>
                Emergency Stop
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "10px 16px", background: "none", border: "none", borderBottom: activeTab === tab.id ? "2.5px solid #0f172a" : "2.5px solid transparent", color: activeTab === tab.id ? "#0f172a" : "#94a3b8", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "color 0.15s", marginBottom: "-1px" }}>
                {tab.label}
                {/* ----------------------------------------------------------------------------- */}
                {/* --- SOCIAL MEDIA ADDITION: Show count badge for social tab --- */}
                {/* ----------------------------------------------------------------------------- */}
                {(tab.id === "bank" || tab.id === "govt") && (
                  <span style={{ background: activeTab === tab.id ? "#0f172a" : "#f1f5f9", color: activeTab === tab.id ? "#fff" : "#64748b", borderRadius: "999px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                    {docs[tab.id]?.length}
                  </span>
                )}
                {tab.id === "social" && (
                  <span style={{ background: activeTab === tab.id ? "#0f172a" : "#f1f5f9", color: activeTab === tab.id ? "#fff" : "#64748b", borderRadius: "999px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                    {social.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px" }}>
        {/* ----------------------------------------------------------------------------- */}
        {/* --- SOCIAL MEDIA ADDITION: Render social section --- */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "social" ? (
          <SocialSection accounts={social} onToggle={toggleSocial} onDelete={deleteSocial} onAdd={addSocial} />
        ) : activeTab === "activity" ? (
          <ActivityLog docs={docs} social={social} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {docs[activeTab].map(doc => (
              <DocCard key={doc.id} doc={doc}
                onToggle={() => toggleAccess(activeTab, doc.id)}
                onApprove={(req) => handleRequest(activeTab, doc.id, req, true)}
                onDeny={(req) => handleRequest(activeTab, doc.id, req, false)}
                onDelete={() => deleteDoc(activeTab, doc.id)}
              />
            ))}
            <button onClick={() => setShowUpload(true)} style={{ background: "none", border: "1.5px dashed #cbd5e1", borderRadius: "16px", padding: "20px", color: "#94a3b8", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              + Upload New Document
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        input:focus { border-color: #0f172a !important; }
      `}</style>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f8fafc", border: "1.5px solid #f1f5f9", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: 600 }}>
      <span style={{ color }}>{value}</span>
      <span style={{ color: "#94a3b8" }}>{label}</span>
    </div>
  );
}