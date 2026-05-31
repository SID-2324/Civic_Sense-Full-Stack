import { useEffect, useState } from "react";

// ─── MOCK CITIZEN DATABASE ────────────────────────────────────────────────────
// In production this comes from your backend API

const mockCitizens = [
  {
    id: "c1",
    name: "Arjun Mehta",
    uid: "UID-4821-9034",
    city: "Mumbai",
    docs: [
      { id: "d1", name: "PAN Card", issuer: "Income Tax Dept.", size: "560 KB", accessGranted: true, lastAccessed: "15 May 2026" },
      { id: "d2", name: "Aadhaar Card", issuer: "UIDAI", size: "1.2 MB", accessGranted: false, lastAccessed: null },
      { id: "d3", name: "HDFC Bank Statement", period: "Apr 2025 – Mar 2026", size: "2.1 MB", accessGranted: false, lastAccessed: null },
      { id: "d4", name: "Voter ID", issuer: "Election Commission", size: "720 KB", accessGranted: false, lastAccessed: null },
    ],
    social: [
      { id: "s1", name: "Instagram", handle: "@arjun.mehta", active: true },
      { id: "s2", name: "LinkedIn", handle: "linkedin.com/in/arjunmehta", active: true },
    ],
    requests: [
      { docId: "d2", docName: "Aadhaar Card", status: "pending", date: "20 May 2026" },
    ],
  },
  {
    id: "c2",
    name: "Priya Sharma",
    uid: "UID-7103-2256",
    city: "Delhi",
    docs: [
      { id: "d5", name: "Passport", issuer: "Ministry of External Affairs", size: "3.8 MB", accessGranted: true, lastAccessed: "10 May 2026" },
      { id: "d6", name: "PAN Card", issuer: "Income Tax Dept.", size: "560 KB", accessGranted: false, lastAccessed: null },
      { id: "d7", name: "SBI Savings Account", period: "Jan – Mar 2026", size: "890 KB", accessGranted: false, lastAccessed: null },
    ],
    social: [
      { id: "s3", name: "Twitter / X", handle: "@priyasharma", active: false },
    ],
    requests: [],
  },
  {
    id: "c3",
    name: "Rohan Verma",
    uid: "UID-3390-8871",
    city: "Pune",
    docs: [
      { id: "d8", name: "Voter ID", issuer: "Election Commission", size: "720 KB", accessGranted: true, lastAccessed: "02 May 2026" },
      { id: "d9", name: "Aadhaar Card", issuer: "UIDAI", size: "1.2 MB", accessGranted: true, lastAccessed: "28 Apr 2026" },
      { id: "d10", name: "Fixed Deposit Certificate", period: "FY 2025–26", size: "340 KB", accessGranted: false, lastAccessed: null },
    ],
    social: [
      { id: "s4", name: "Facebook", handle: "facebook.com/rohanverma", active: true },
      { id: "s5", name: "YouTube", handle: "@rohanverma", active: true },
    ],
    requests: [
      { docId: "d10", docName: "Fixed Deposit Certificate", status: "pending", date: "25 May 2026" },
    ],
  },
];

const GOV_BODY = {
  name: "Mumbai Municipal Corporation",
  dept: "Department of Civil Records",
  id: "GOV-MMC-001",
};

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

function getSessionHeaders() {
  const session = getSessionProfile();
  return {
    "x-demo-user-id": session?.id || "9764b712-eaf7-4836-895f-d5a4348b2bb5",
    "x-demo-user-email": session?.email || "demo@civicvault.local",
    "x-demo-user-name": session?.name || GOV_BODY.name,
    "x-demo-role": session?.role || "admin",
    ...(session?.government_id ? { "x-demo-government-id": session.government_id } : {}),
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getSessionHeaders(),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
      color, background: bg, border: `1.5px solid ${border}`,
    }}>
      {label}
    </span>
  );
}

function StatusDot({ granted }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8, borderRadius: "50%",
      background: granted ? "#22c55e" : "#e2e8f0",
      marginRight: 6,
    }} />
  );
}

// ─── CITIZEN SEARCH BAR ───────────────────────────────────────────────────────

function SearchBar({ query, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: 14, top: "50%",
        transform: "translateY(-50%)",
        color: "#94a3b8", fontSize: "14px", pointerEvents: "none",
      }}>
        ⌕
      </div>
      <input
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Search citizen by name, UID, or city..."
        style={{
          width: "100%", padding: "12px 16px 12px 36px",
          borderRadius: "12px", border: "1.5px solid #e2e8f0",
          fontSize: "14px", fontFamily: "inherit",
          outline: "none", color: "#0f172a",
          background: "#fff",
          boxSizing: "border-box",
          boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
        }}
      />
    </div>
  );
}

// ─── CITIZEN LIST CARD ────────────────────────────────────────────────────────

function CitizenListCard({ citizen, isSelected, onClick }) {
  const grantedCount = citizen.docs.filter(d => d.accessGranted).length;
  const pendingCount = citizen.requests.filter(r => r.status === "pending").length;

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? "#0f172a" : "#fff",
        borderRadius: "14px",
        border: isSelected ? "1.5px solid #0f172a" : "1.5px solid #f1f5f9",
        padding: "16px 18px",
        cursor: "pointer",
        boxShadow: isSelected ? "0 4px 20px rgba(15,23,42,0.15)" : "0 1px 4px rgba(15,23,42,0.04)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "14px", color: isSelected ? "#fff" : "#0f172a" }}>
        {citizen.name}
      </div>
      <div style={{ fontSize: "12px", color: isSelected ? "#94a3b8" : "#64748b", marginTop: 3 }}>
        {citizen.uid} · {citizen.city}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Badge
          label={`${grantedCount} docs open`}
          color={isSelected ? "#86efac" : "#16a34a"}
          bg={isSelected ? "rgba(34,197,94,0.15)" : "#f0fdf4"}
          border={isSelected ? "rgba(34,197,94,0.3)" : "#bbf7d0"}
        />
        {pendingCount > 0 && (
          <Badge
            label={`${pendingCount} pending`}
            color={isSelected ? "#fcd34d" : "#92400e"}
            bg={isSelected ? "rgba(245,158,11,0.15)" : "#fffbeb"}
            border={isSelected ? "rgba(245,158,11,0.3)" : "#fde68a"}
          />
        )}
      </div>
    </div>
  );
}

// ─── DOCUMENT ROW ─────────────────────────────────────────────────────────────

function DocRow({ doc, existingRequest, onRequest }) {
  const isPending = existingRequest?.status === "pending";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px",
      background: "#fff",
      borderRadius: "12px",
      border: "1.5px solid #f1f5f9",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <StatusDot granted={doc.accessGranted} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{doc.name}</span>
        </div>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 3, paddingLeft: 14 }}>
          {doc.period || doc.issuer} · {doc.size}
          {doc.lastAccessed && ` · Last accessed ${doc.lastAccessed}`}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {doc.accessGranted ? (
          <>
            <Badge label="ACCESS GRANTED" color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
            <button style={{
              padding: "6px 14px", borderRadius: "8px",
              border: "1.5px solid #bfdbfe", background: "#eff6ff",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              View
            </button>
          </>
        ) : isPending ? (
          <Badge label="REQUEST SENT" color="#92400e" bg="#fffbeb" border="#fde68a" />
        ) : (
          <>
            <Badge label="LOCKED" color="#94a3b8" bg="#f8fafc" border="#e2e8f0" />
            <button
              onClick={() => onRequest(doc)}
              style={{
                padding: "6px 14px", borderRadius: "8px",
                border: "1.5px solid #e2e8f0", background: "#f8fafc",
                color: "#475569", fontSize: "12px", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Request Access
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CITIZEN DETAIL PANEL ─────────────────────────────────────────────────────

function CitizenDetail({ citizen, onRequest }) {
  const [activeSection, setActiveSection] = useState("docs");
  const grantedDocs = citizen.docs.filter(d => d.accessGranted);
  const lockedDocs = citizen.docs.filter(d => !d.accessGranted);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Citizen header */}
      <div style={{
        background: "#0f172a", borderRadius: "16px",
        padding: "22px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "20px", color: "#fff", letterSpacing: "-0.02em" }}>
            {citizen.name}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: 4 }}>
            {citizen.uid} · {citizen.city}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "22px", color: "#22c55e" }}>{grantedDocs.length}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>Accessible</div>
          </div>
          <div style={{ width: 1, background: "#1e293b" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "22px", color: "#64748b" }}>{lockedDocs.length}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>Locked</div>
          </div>
          <div style={{ width: 1, background: "#1e293b" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "22px", color: "#6366f1" }}>{citizen.social.length}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>Social</div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1.5px solid #f1f5f9", paddingBottom: 0 }}>
        {["docs", "social", "requests"].map(sec => (
          <button key={sec} onClick={() => setActiveSection(sec)} style={{
            padding: "8px 16px", background: "none", border: "none",
            borderBottom: activeSection === sec ? "2.5px solid #0f172a" : "2.5px solid transparent",
            color: activeSection === sec ? "#0f172a" : "#94a3b8",
            fontWeight: activeSection === sec ? 700 : 500,
            fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
            marginBottom: "-1.5px", textTransform: "capitalize",
          }}>
            {sec === "docs" ? "Documents" : sec === "social" ? "Social Media" : "Requests"}
            {sec === "requests" && citizen.requests.filter(r => r.status === "pending").length > 0 && (
              <span style={{ marginLeft: 6, background: "#f59e0b", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>
                {citizen.requests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents section */}
      {activeSection === "docs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {citizen.docs.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: "14px" }}>No documents on record.</div>
          ) : citizen.docs.map(doc => (
            <DocRow
              key={doc.id}
              doc={doc}
              existingRequest={citizen.requests.find(r => r.docId === doc.id)}
              onRequest={(doc) => onRequest(citizen, doc)}
            />
          ))}
        </div>
      )}

      {/* Social media section */}
      {activeSection === "social" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {citizen.social.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: "14px" }}>No linked social accounts.</div>
          ) : citizen.social.map(acc => (
            <div key={acc.id} style={{
              background: "#fff", borderRadius: "12px",
              border: "1.5px solid #f1f5f9", padding: "14px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{acc.name}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2 }}>{acc.handle}</div>
              </div>
              <Badge
                label={acc.active ? "ACTIVE" : "INACTIVE"}
                color={acc.active ? "#16a34a" : "#94a3b8"}
                bg={acc.active ? "#f0fdf4" : "#f8fafc"}
                border={acc.active ? "#bbf7d0" : "#e2e8f0"}
              />
            </div>
          ))}
          <div style={{ fontSize: "12px", color: "#94a3b8", padding: "6px 4px" }}>
            Government bodies can view social account status only. Activation/deactivation is controlled by the citizen.
          </div>
        </div>
      )}

      {/* Requests section */}
      {activeSection === "requests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {citizen.requests.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: "14px" }}>No access requests sent.</div>
          ) : citizen.requests.map((req, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: "12px",
              border: `1.5px solid ${req.status === "pending" ? "#fde68a" : req.status === "approved" ? "#bbf7d0" : "#fca5a5"}`,
              padding: "14px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{req.docName}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 2 }}>Requested on {req.date}</div>
              </div>
              <Badge
                label={req.status.toUpperCase()}
                color={req.status === "pending" ? "#92400e" : req.status === "approved" ? "#16a34a" : "#dc2626"}
                bg={req.status === "pending" ? "#fffbeb" : req.status === "approved" ? "#f0fdf4" : "#fff1f2"}
                border={req.status === "pending" ? "#fde68a" : req.status === "approved" ? "#bbf7d0" : "#fca5a5"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN GOV PORTAL ──────────────────────────────────────────────────────────

export default function GovPortal() {
  const [citizens, setCitizens] = useState(mockCitizens);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [requestModal, setRequestModal] = useState(null); // { citizen, doc }

  const refreshCitizens = async () => {
    try {
      const payload = await apiRequest("/admin/citizens");
      setCitizens(payload.citizens || []);
      if (!selectedId && payload.citizens?.length) {
        setSelectedId(payload.citizens[0].id);
      }
    } catch {
      setCitizens(mockCitizens);
    }
  };

  useEffect(() => {
    void refreshCitizens();
  }, []);

  const showToast = (msg, color = "#22c55e") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = citizens.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.uid.toLowerCase().includes(query.toLowerCase()) ||
    c.city.toLowerCase().includes(query.toLowerCase())
  );

  const selected = citizens.find(c => c.id === selectedId) || null;

  const sendRequest = async () => {
    if (!requestModal) return;
    const { citizen, doc } = requestModal;
    try {
      await apiRequest("/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: citizen.id,
          officerName: GOV_BODY.name,
          reason: `Request access to ${doc.name}`,
          caseId: doc.id,
        }),
      });

      setRequestModal(null);
      showToast(`Access requested for "${doc.name}"`, "#f59e0b");
      await refreshCitizens();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to send request", "#dc2626");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Request Confirmation Modal */}
      {requestModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", animation: "fadeIn 0.15s ease" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px 28px", maxWidth: 400, width: "90%", boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#0f172a", marginBottom: 6 }}>Request Document Access</div>
            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
              You are requesting access to <strong>"{requestModal.doc.name}"</strong> from citizen <strong>{requestModal.citizen.name}</strong>.<br />
              The citizen will be notified and must approve before you can view this document.
            </div>
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>REQUEST FROM</div>
              <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 700 }}>{GOV_BODY.name}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{GOV_BODY.dept} · {GOV_BODY.id}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRequestModal(null)} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={sendRequest} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Send Request</button>
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
      <div style={{ background: "#0f172a", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "17px", color: "#fff", letterSpacing: "-0.02em" }}>CivicVault</div>
              <div style={{ fontSize: "11px", color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Government Portal</div>
            </div>
            <div style={{ width: 1, height: 32, background: "#1e293b" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#94a3b8" }}>{GOV_BODY.name}</div>
              <div style={{ fontSize: "11px", color: "#475569" }}>{GOV_BODY.dept} · {GOV_BODY.id}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ padding: "5px 14px", borderRadius: "999px", background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.2)", fontSize: "12px", color: "#22c55e", fontWeight: 700 }}>
              ● Verified Body
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

        {/* Left: search + citizen list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a", letterSpacing: "0.02em" }}>
            CITIZEN SEARCH
          </div>
          <SearchBar query={query} onChange={q => { setQuery(q); setSelectedId(null); }} />

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: "10px", border: "1.5px solid #f1f5f9", padding: "10px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>{citizens.length}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>Total Citizens</div>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: "10px", border: "1.5px solid #f1f5f9", padding: "10px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#f59e0b" }}>
                {citizens.reduce((n, c) => n + c.requests.filter(r => r.status === "pending").length, 0)}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>Pending Requests</div>
            </div>
          </div>

          {/* Citizen list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: "14px" }}>No citizens found.</div>
            ) : filtered.map(c => (
              <CitizenListCard
                key={c.id}
                citizen={c}
                isSelected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: citizen detail */}
        <div>
          {selected ? (
            <CitizenDetail
              citizen={selected}
              onRequest={(citizen, doc) => setRequestModal({ citizen, doc })}
            />
          ) : (
            <div style={{
              background: "#fff", borderRadius: "16px",
              border: "1.5px solid #f1f5f9",
              padding: "60px 40px", textAlign: "center",
              boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
            }}>
              <div style={{ fontSize: "32px", marginBottom: 14 }}>⌕</div>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a", marginBottom: 8 }}>Select a citizen</div>
              <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                Search for a citizen by name, UID, or city and select them to view their accessible documents and social accounts.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        input:focus { border-color: #0f172a !important; outline: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
