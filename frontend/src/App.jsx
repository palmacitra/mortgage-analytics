import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API = "";   // relative path — Vite proxy routes /api/* → localhost:8000

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

const scoreColor = (s) => {
  if (s >= 70) return "#16a34a";
  if (s >= 45) return "#d97706";
  return "#dc2626";
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────────────────────────
const Ico = {
  Dashboard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Leads:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Apps:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Pipeline:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="12" rx="1"/><rect x="16" y="3" width="6" height="8" rx="1"/></svg>,
  Tasks:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  AI:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  Analytics: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Settings:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Plus:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Send:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9 22,2"/></svg>,
  Check:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  User:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Eye:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  X:         () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const LEADS = [
  { id:"L001", name:"Budi Santoso",     phone:"0812-3456-7890", location:"Jakarta Selatan", income:12000000, status:"Hot",  source:"Website",  date:"2024-04-10" },
  { id:"L002", name:"Siti Rahayu",      phone:"0813-2345-6789", location:"Bandung",         income:8500000,  status:"Warm", source:"Referral", date:"2024-04-11" },
  { id:"L003", name:"Ahmad Fauzi",      phone:"0814-3456-7891", location:"Jakarta Pusat",   income:22000000, status:"Hot",  source:"Walk-in",  date:"2024-04-11" },
  { id:"L004", name:"Dewi Kusumawati",  phone:"0815-4567-8902", location:"Surabaya",        income:6500000,  status:"Cold", source:"Website",  date:"2024-04-12" },
  { id:"L005", name:"Hendra Gunawan",   phone:"0816-5678-9013", location:"Jakarta Barat",   income:18000000, status:"Warm", source:"Social",   date:"2024-04-12" },
  { id:"L006", name:"Rina Permatasari", phone:"0817-6789-0124", location:"Tangerang Sel.",  income:9500000,  status:"Hot",  source:"Referral", date:"2024-04-13" },
  { id:"L007", name:"Joko Pramono",     phone:"0818-7890-1235", location:"Bekasi",          income:5500000,  status:"Cold", source:"Website",  date:"2024-04-13" },
  { id:"L008", name:"Lestari Widodo",   phone:"0819-8901-2346", location:"Jakarta Timur",   income:14500000, status:"Warm", source:"Walk-in",  date:"2024-04-14" },
];

const APPLICATIONS = [
  { id:"APP-001", name:"Budi Santoso",     amount:480000000,   type:"KPR Non-Subsidi", status:"Pre-Approved",    score:82, date:"2024-04-01" },
  { id:"APP-002", name:"Siti Rahayu",      amount:280000000,   type:"KPR FLPP",        status:"Pending Review",  score:61, date:"2024-04-02" },
  { id:"APP-003", name:"Ahmad Fauzi",      amount:850000000,   type:"KPR Non-Subsidi", status:"Pre-Approved",    score:88, date:"2024-04-03" },
  { id:"APP-004", name:"Dewi Kusumawati",  amount:180000000,   type:"KPR FLPP",        status:"Tidak Disetujui", score:28, date:"2024-04-04" },
  { id:"APP-005", name:"Hendra Gunawan",   amount:620000000,   type:"KPR Non-Subsidi", status:"Pending Review",  score:55, date:"2024-04-05" },
  { id:"APP-006", name:"Rina Permatasari", amount:320000000,   type:"KPR Non-Subsidi", status:"Pre-Approved",    score:76, date:"2024-04-06" },
  { id:"APP-007", name:"Rudi Hartono",     amount:1200000000,  type:"KPR Non-Subsidi", status:"Pre-Approved",    score:95, date:"2024-04-07" },
];

const PIPELINE_STAGES = [
  { id:"inquiry",    label:"Inquiry",       cards:[
    { name:"Bambang S.",   amount:350000000, days:2 },
    { name:"Kartika Sari", amount:580000000, days:1 },
    { name:"Doni P.",      amount:200000000, days:4 },
  ]},
  { id:"assessment", label:"Assessment",    cards:[
    { name:"Budi Santoso", amount:480000000, days:6 },
    { name:"Lestari W.",   amount:420000000, days:3 },
  ]},
  { id:"submission", label:"Submission",    cards:[
    { name:"Siti Rahayu",  amount:280000000, days:10 },
    { name:"Ahmad Fauzi",  amount:850000000, days:8  },
  ]},
  { id:"approval",   label:"Bank Approval", cards:[
    { name:"Rina P.",      amount:320000000, days:14 },
  ]},
  { id:"disbursed",  label:"Disbursed",     cards:[
    { name:"Rudi Hartono", amount:1200000000, days:22 },
    { name:"Hendra G.",    amount:620000000,  days:18 },
  ]},
];

const INITIAL_TASKS = [
  { id:1, title:"Follow-up call — Budi Santoso",        due:"Hari ini", priority:"High",   done:false, tag:"Lead"        },
  { id:2, title:"Verifikasi dokumen — Ahmad Fauzi",      due:"Hari ini", priority:"High",   done:false, tag:"Application" },
  { id:3, title:"Kirim penawaran rate — Rina P.",        due:"Besok",    priority:"Medium", done:false, tag:"Application" },
  { id:4, title:"Update pipeline Rudi Hartono",          due:"Besok",    priority:"Low",    done:true,  tag:"Pipeline"    },
  { id:5, title:"Review dokumen KTP — Lestari W.",       due:"12 Apr",   priority:"Medium", done:false, tag:"Application" },
  { id:6, title:"Jadwalkan kunjungan properti",          due:"13 Apr",   priority:"Low",    done:false, tag:"Lead"        },
  { id:7, title:"Laporan bulanan April",                 due:"30 Apr",   priority:"Medium", done:false, tag:"Internal"    },
  { id:8, title:"Training produk KPR FLPP baru",        due:"30 Apr",   priority:"Low",    done:true,  tag:"Internal"    },
];

const ANALYTICS_DATA = [
  { month:"Okt", leads:28, apps:14, disbursed:8  },
  { month:"Nov", leads:34, apps:18, disbursed:11 },
  { month:"Des", leads:41, apps:22, disbursed:15 },
  { month:"Jan", leads:38, apps:20, disbursed:13 },
  { month:"Feb", leads:52, apps:27, disbursed:18 },
  { month:"Mar", leads:61, apps:33, disbursed:24 },
  { month:"Apr", leads:47, apps:29, disbursed:19 },
];

const DISTRICT_DATA = [
  { name:"Tangsel",  value:9 },
  { name:"Jak.Sel",  value:8 },
  { name:"Jak.Tim",  value:6 },
  { name:"Bekasi",   value:5 },
  { name:"Depok",    value:4 },
  { name:"Bandung",  value:3 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`card p-4 ${highlight ? "bg-neutral-900 border-neutral-900" : ""}`}>
      <p className={`text-xs font-medium mb-2 ${highlight ? "text-neutral-400" : "text-neutral-500"}`}>{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${highlight ? "text-white" : "text-neutral-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${highlight ? "text-neutral-400" : "text-neutral-400"}`}>{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-3 shadow-lg text-xs">
      {label && <p className="font-semibold text-neutral-700 mb-1.5">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.value > 100000 ? fmtIDR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO COMPONENT — uses SVG fallback if image fails
// ─────────────────────────────────────────────────────────────────────────────
function LogoMark({ size = 32, className = "" }) {
  const [imgErr, setImgErr] = useState(false);
  if (imgErr) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-neutral-900 text-white font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        H
      </div>
    );
  }
  return (
    <img
      src="/src/assets/logo.png"
      alt="Logo"
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgErr(true)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AMORTIZATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AmortModal({ financials, onClose }) {
  const { max_loan_principal_idr, annual_interest_rate_pct, tenor_months } = financials;
  const r = annual_interest_rate_pct / 100 / 12;
  const inst = max_loan_principal_idr * r * (1 + r) ** tenor_months / ((1 + r) ** tenor_months - 1);

  const rows = [];
  let bal = max_loan_principal_idr;
  for (let m = 1; m <= Math.min(24, tenor_months); m++) {
    const interest = bal * r;
    const principal = inst - interest;
    bal = Math.max(0, bal - principal);
    rows.push({ m, inst, interest, principal, bal });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div>
            <h3 className="font-bold text-neutral-900">Jadwal Amortisasi</h3>
            <p className="text-xs text-neutral-500 mt-0.5">24 bulan pertama dari {tenor_months / 12} tahun tenor</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition">
            <Ico.X />
          </button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-neutral-50">
              <tr>
                {["Bln","Cicilan","Pokok","Bunga","Sisa Pokok"].map(h => (
                  <th key={h} className="th text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.m} className="trow">
                  <td className="td font-mono text-neutral-500">{row.m}</td>
                  <td className="td text-right text-neutral-700 font-medium">{fmtIDR(row.inst)}</td>
                  <td className="td text-right text-emerald-600 font-medium">{fmtIDR(row.principal)}</td>
                  <td className="td text-right text-amber-600 font-medium">{fmtIDR(row.interest)}</td>
                  <td className="td text-right text-neutral-800 font-semibold">{fmtIDR(row.bal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Username dan password harus diisi.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (username === "user" && password === "user") {
        onLogin({ username });
      } else {
        setError("Username atau password salah.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <LogoMark size={48} className="mb-4" />
          <h1 className="text-lg font-bold text-neutral-900">Hyper Mortgage Agentic Tool</h1>
          <p className="text-sm text-neutral-500 mt-1">AI-Powered KPR Pre-Approval Engine</p>
        </div>

        <div className="card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-800 mb-5">Masuk ke akun Anda</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Username</label>
              <input
                className="field"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="field pr-10"
                  type={showPass ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <Ico.EyeOff /> : <Ico.Eye />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading
                ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>
                : null}
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
          <p className="text-[11px] text-neutral-400 text-center mt-4">
            Demo: <span className="font-mono text-neutral-600">user</span> / <span className="font-mono text-neutral-600">user</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key:"dashboard",    label:"Dashboard",    Icon: Ico.Dashboard },
  { key:"leads",        label:"Leads",        Icon: Ico.Leads     },
  { key:"applications", label:"Applications", Icon: Ico.Apps      },
  { key:"pipeline",     label:"Pipeline",     Icon: Ico.Pipeline  },
  { key:"tasks",        label:"Tasks",        Icon: Ico.Tasks     },
  { key:"ai-agent",     label:"AI Agent",     Icon: Ico.AI        },
  { key:"analytics",    label:"Analytics",    Icon: Ico.Analytics },
  { key:"settings",     label:"Settings",     Icon: Ico.Settings  },
];

function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-4 py-4 border-b border-neutral-100 flex items-center gap-2.5">
        <LogoMark size={30} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-neutral-900 leading-tight truncate">Hyper Mortgage</p>
          <p className="text-[10px] text-neutral-400 leading-tight">Agentic Tool</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPage(key)}
            className={`nav-item ${page === key ? "active" : ""}`}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-neutral-100">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <Ico.User />
          </div>
          <span className="text-xs font-semibold text-neutral-700 truncate">{user?.username}</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="nav-item text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <Ico.Logout />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPage({ customers }) {
  const [selected,  setSelected]  = useState("");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [showAmort, setShowAmort] = useState(false);

  // When customers list arrives after async fetch, don't reset selection
  const customerList = customers ?? [];

  const handleAnalyze = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(`${API}/api/analyze`, { customer_id: selected });
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal menghubungi backend. Pastikan server berjalan di port 8000.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const f  = result?.financials;
  const riskMap = {
    Low:    { cls:"badge-green",  label:"Risiko Rendah"  },
    Medium: { cls:"badge-yellow", label:"Risiko Sedang"  },
    High:   { cls:"badge-red",    label:"Risiko Tinggi"  },
  };
  const approvalMap = {
    "Pre-Approved":    { cls:"badge-green",  label:"Pre-Approved"     },
    "Pending Review":  { cls:"badge-yellow", label:"Pending Review"   },
    "Tidak Disetujui": { cls:"badge-red",    label:"Tidak Disetujui"  },
  };
  const rb = result ? riskMap[result.risk_level]         : null;
  const ab = result ? approvalMap[result.approval_status] : null;

  const selectedCustomer = customerList.find(c => c.id === selected);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="KPR Pre-Approval Analysis Engine" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Nasabah"   value={customerList.length || "15"} sub="Profil sintetis" />
        <StatCard label="Pre-Approved"    value="9"  sub="+8% dari bulan lalu" highlight />
        <StatCard label="Pending Review"  value="4"  sub="-2% dari bulan lalu" />
        <StatCard label="Tidak Disetujui" value="2"  sub="Tidak berubah" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left panel: selector ── */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-neutral-800 mb-0.5">Analisis Nasabah</h2>
            <p className="text-xs text-neutral-400 mb-4">Pilih profil dari database sintetis</p>

            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Nasabah</label>
            <select
              className="field mb-4"
              value={selected}
              onChange={e => {
                setSelected(e.target.value);
                setResult(null);
                setError(null);
              }}
            >
              <option value="">-- Pilih Nasabah --</option>
              {customerList.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
              ))}
            </select>

            {/* Preview card */}
            {selectedCustomer && (
              <div className="card2 p-3 grid grid-cols-2 gap-2 text-xs mb-4">
                <div>
                  <p className="text-neutral-400">Penghasilan</p>
                  <p className="font-semibold text-neutral-800 mt-0.5">{fmtIDR(selectedCustomer.monthly_income_idr)}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Sewa/bulan</p>
                  <p className="font-semibold text-neutral-800 mt-0.5">{fmtIDR(selectedCustomer.current_rent_idr)}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Kewajiban</p>
                  <p className="font-semibold text-neutral-800 mt-0.5">{fmtIDR(selectedCustomer.existing_debt_idr)}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Kredit</p>
                  <p className={`font-semibold mt-0.5 ${selectedCustomer.credit_history === "Good" ? "text-emerald-600" : "text-red-600"}`}>
                    {selectedCustomer.credit_history}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-400">Pekerjaan</p>
                  <p className="font-semibold text-neutral-800 mt-0.5">{selectedCustomer.employment_type}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selected || loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {loading ? "Menganalisis..." : "Analisis KPR"}
            </button>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">{error}</p>
            )}
          </div>

          {/* KPR params */}
          <div className="card p-4">
            <p className="section-label mb-3">Parameter KPR</p>
            <div className="grid grid-cols-2 gap-2">
              {[["Tenor","20 Tahun"],["Bunga","7.75% p.a."],["Maks. DTI","40%"],["DP Non-Sub","10%"],["DP FLPP","1%"],["Batas FLPP","Rp 8jt/bln"]].map(([k,v]) => (
                <div key={k} className="card2 p-2.5">
                  <p className="text-[10px] text-neutral-400">{k}</p>
                  <p className="text-xs font-bold text-neutral-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel: results ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {!result && !loading && (
            <div className="card flex-1 min-h-[300px] flex flex-col items-center justify-center text-center py-16 border-dashed">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center mb-3 text-neutral-300">
                <Ico.Apps />
              </div>
              <p className="text-neutral-600 font-semibold text-sm">Pilih nasabah dan klik Analisis</p>
              <p className="text-neutral-400 text-xs mt-1">Hasil analisis KPR akan tampil di sini</p>
            </div>
          )}

          {result && f && (
            <>
              {/* Status banner */}
              <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-neutral-900">{result.customer_name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{result.kpr_program}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {rb && <span className={rb.cls}>{rb.label}</span>}
                  {ab && <span className={ab.cls}>{ab.label}</span>}
                </div>
              </div>

              {/* Gauge + bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4">
                  <p className="section-label mb-3">Skor Keterjangkauan</p>
                  <div className="relative flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <RadialBarChart
                        cx="50%" cy="80%" innerRadius="60%" outerRadius="100%"
                        startAngle={180} endAngle={0}
                        data={[{ name:"score", value: result.affordability_score, fill: scoreColor(result.affordability_score) }]}
                      >
                        <PolarAngleAxis type="number" domain={[0,100]} angleAxisId={0} tick={false} />
                        <RadialBar minAngle={2} background={{ fill:"#f5f5f5" }} clockWise dataKey="value" cornerRadius={6} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-1 flex flex-col items-center">
                      <span className="text-3xl font-black" style={{ color: scoreColor(result.affordability_score) }}>
                        {result.affordability_score}
                      </span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">Affordability Score</span>
                    </div>
                  </div>
                  {/* DTI meter */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>DTI Ratio</span>
                      <span className="font-mono font-semibold">{f.dti_ratio_pct}% / {f.max_dti_allowed_pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (f.dti_ratio_pct / f.max_dti_allowed_pct) * 100)}%`,
                          backgroundColor: scoreColor(result.affordability_score),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <p className="section-label mb-3">Sewa vs. Cicilan KPR</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={[
                        { name:"Sewa", amount: f.current_rent_idr },
                        { name:"Cicilan", amount: f.proposed_installment_idr },
                      ]}
                      margin={{ top:4, right:4, left:0, bottom:4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:"#737373" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tickFormatter={v => `${(v/1000000).toFixed(0)}jt`}
                        tick={{ fontSize:10, fill:"#a3a3a3" }}
                        axisLine={false} tickLine={false} width={36}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="amount" radius={[4,4,0,0]} name="IDR">
                        <Cell fill="#e5e5e5" />
                        <Cell fill="#171717" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium border ${
                    f.rent_vs_mortgage_delta > 0
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {f.rent_vs_mortgage_delta > 0
                      ? `Cicilan lebih tinggi ${fmtIDR(f.rent_vs_mortgage_delta)}/bln dari sewa`
                      : `Cicilan lebih rendah ${fmtIDR(Math.abs(f.rent_vs_mortgage_delta))}/bln dari sewa`}
                  </div>
                </div>
              </div>

              {/* Metric tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Maks. KPR",         fmtIDR(f.max_loan_principal_idr),   `${f.tenor_months/12}thn @ ${f.annual_interest_rate_pct}%`],
                  ["Harga Rmh Maks.",    fmtIDR(f.max_house_price_idr),       `DP ${f.dp_rate_pct}% = ${fmtIDR(f.down_payment_idr)}`],
                  ["Cicilan/Bulan",      fmtIDR(f.proposed_installment_idr),  "Sistem anuitas"],
                  ["Kewajiban Saat Ini", fmtIDR(f.existing_debt_idr),         `DTI: ${f.dti_ratio_pct}%`],
                ].map(([l, v, s]) => (
                  <div key={l} className="card p-3">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-sm font-bold text-neutral-900 leading-tight">{v}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{s}</p>
                  </div>
                ))}
              </div>

              {/* District recommendations */}
              <div className="card p-4">
                <p className="section-label mb-3">Rekomendasi Distrik Properti</p>
                {result.recommended_districts.length === 0 ? (
                  <p className="text-center py-6 text-neutral-400 text-sm">
                    Tidak ada distrik yang sesuai anggaran nasabah.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.recommended_districts.map(d => (
                      <div
                        key={d.district}
                        className={`rounded-xl border p-3 ${
                          d.is_home_district
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                        } transition`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${d.is_home_district ? "text-white" : "text-neutral-900"}`}>
                            {d.district}
                          </span>
                          {d.is_home_district && (
                            <span className="text-[10px] bg-white text-neutral-900 font-semibold px-2 py-0.5 rounded-full">
                              Lokasi Anda
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mb-1.5 ${d.is_home_district ? "text-neutral-300" : "text-neutral-500"}`}>
                          {d.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-semibold ${d.is_home_district ? "text-neutral-300" : "text-neutral-500"}`}>
                            {d.recommended_unit}
                          </span>
                          <span className={`text-xs font-bold ${d.is_home_district ? "text-white" : "text-neutral-900"}`}>
                            {fmtIDR(d.price_estimate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amortization button */}
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowAmort(true)} className="btn-outline text-xs">
                  Lihat Jadwal Amortisasi
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAmort && f && <AmortModal financials={f} onClose={() => setShowAmort(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL OVERLAY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ModalOverlay({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition">
            <Ico.X />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// LEADS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LeadsPage() {
  const [leads, setLeads] = useState(LEADS);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", location:"", income:"", status:"Warm", source:"Website" });
  const statusBadge = { Hot:"badge-red", Warm:"badge-yellow", Cold:"badge-blue" };
  const filtered = filter === "All" ? leads : leads.filter(l => l.status === filter);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    const newId = "L" + String(leads.length + 1).padStart(3, "0");
    const today = new Date().toISOString().split("T")[0];
    setLeads(prev => [...prev, { id: newId, ...form, income: Number(form.income) || 0, date: today }]);
    setForm({ name:"", phone:"", location:"", income:"", status:"Warm", source:"Website" });
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} prospek aktif`}
        action={
          <button type="button" className="btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
            <Ico.Plus /> Tambah Lead
          </button>
        }
      />
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {["All","Hot","Warm","Cold"].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === f
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f} {f === "All" ? `(${leads.length})` : `(${leads.filter(l=>l.status===f).length})`}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {["ID","Nama","Telepon","Lokasi","Penghasilan","Status","Sumber","Tanggal"].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="trow cursor-pointer">
                <td className="td font-mono text-xs text-neutral-400">{l.id}</td>
                <td className="td font-semibold text-neutral-900">{l.name}</td>
                <td className="td font-mono text-xs text-neutral-500">{l.phone}</td>
                <td className="td text-neutral-600">{l.location}</td>
                <td className="td font-mono text-xs font-semibold text-neutral-800">{fmtIDR(l.income)}</td>
                <td className="td"><span className={statusBadge[l.status]}>{l.status}</span></td>
                <td className="td text-neutral-500">{l.source}</td>
                <td className="td text-neutral-400">{l.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-neutral-400 text-sm">Tidak ada leads ditemukan.</div>
        )}
      </div>

      {showModal && (
        <ModalOverlay title="Tambah Lead Baru" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            {[
              ["Nama Lengkap *", "name", "text", "Nama prospek"],
              ["No. Telepon *",  "phone","text", "0812-xxxx-xxxx"],
              ["Lokasi",        "location","text","Jakarta Selatan"],
              ["Penghasilan (Rp)","income","number","10000000"],
            ].map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">{label}</label>
                <input
                  type={type}
                  className="field"
                  placeholder={ph}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Status</label>
              <select className="field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {["Hot","Warm","Cold"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Sumber</label>
              <select className="field" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                {["Website","Referral","Walk-in","Social","Lainnya"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">Simpan Lead</button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ApplicationsPage() {
  const [apps, setApps] = useState(APPLICATIONS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", amount:"", type:"KPR Non-Subsidi", status:"Pending Review", score:"" });
  const statusBadge = {
    "Pre-Approved":    "badge-green",
    "Pending Review":  "badge-yellow",
    "Tidak Disetujui": "badge-red",
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    const newId = "APP-" + String(apps.length + 1).padStart(3, "0");
    const today = new Date().toISOString().split("T")[0];
    setApps(prev => [...prev, { id: newId, ...form, amount: Number(form.amount) || 0, score: Number(form.score) || 50, date: today }]);
    setForm({ name:"", amount:"", type:"KPR Non-Subsidi", status:"Pending Review", score:"" });
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={`${apps.length} pengajuan KPR`}
        action={
          <button type="button" className="btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
            <Ico.Plus /> Pengajuan Baru
          </button>
        }
      />
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {["No. Pengajuan","Nasabah","Jumlah KPR","Tipe Program","Skor","Status","Tanggal"].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a.id} className="trow cursor-pointer">
                <td className="td font-mono text-xs text-neutral-400">{a.id}</td>
                <td className="td font-semibold text-neutral-900">{a.name}</td>
                <td className="td font-mono text-sm font-semibold text-neutral-800">{fmtIDR(a.amount)}</td>
                <td className="td text-neutral-600">{a.type}</td>
                <td className="td">
                  <span className="font-mono text-sm font-black" style={{ color: scoreColor(a.score) }}>{a.score}</span>
                </td>
                <td className="td"><span className={statusBadge[a.status]}>{a.status}</span></td>
                <td className="td text-neutral-400">{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ModalOverlay title="Pengajuan KPR Baru" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            {[
              ["Nama Nasabah *",   "name",   "text",   "Nama lengkap nasabah"],
              ["Jumlah KPR (Rp) *","amount", "number", "500000000"],
              ["Affordability Score","score","number", "0-100"],
            ].map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">{label}</label>
                <input
                  type={type}
                  className="field"
                  placeholder={ph}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Tipe Program</label>
              <select className="field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {["KPR Non-Subsidi","KPR FLPP"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Status</label>
              <select className="field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {["Pending Review","Pre-Approved","Tidak Disetujui"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">Simpan Pengajuan</button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function PipelinePage() {
  const [stages, setStages] = useState(PIPELINE_STAGES);
  const [showModal, setShowModal] = useState(false);
  const [targetStage, setTargetStage] = useState(null);
  const [form, setForm] = useState({ name:"", amount:"" });

  const openAdd = (stageId) => {
    setTargetStage(stageId);
    setForm({ name:"", amount:"" });
    setShowModal(true);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    setStages(prev => prev.map(st =>
      st.id === targetStage
        ? { ...st, cards: [...st.cards, { name: form.name, amount: Number(form.amount) || 0, days: 0 }] }
        : st
    ));
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Status pengajuan KPR per tahap"
        action={
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-neutral-900 inline-block"></span>
            {stages.reduce((s, st) => s + st.cards.length, 0)} total pengajuan
          </div>
        }
      />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage.id} className="min-w-[210px] max-w-[210px] flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">{stage.label}</span>
              <span className="text-[10px] bg-neutral-100 text-neutral-500 rounded-full px-2 py-0.5 font-mono font-semibold">
                {stage.cards.length}
              </span>
            </div>
            {stage.cards.map((card, i) => (
              <div key={i} className="card p-3 cursor-pointer hover:border-neutral-400 hover:shadow-sm transition-all">
                <p className="text-xs font-bold text-neutral-900 mb-1">{card.name}</p>
                <p className="text-[11px] font-mono text-neutral-500">{fmtIDR(card.amount)}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-neutral-400">{card.days} hari</span>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    card.days <= 5 ? "bg-emerald-400" : card.days <= 14 ? "bg-amber-400" : "bg-red-400"
                  }`}></span>
                </div>
              </div>
            ))}
            <div
              className="border-2 border-dashed border-neutral-200 rounded-xl p-2 text-center cursor-pointer hover:border-neutral-400 transition"
              onClick={() => openAdd(stage.id)}
            >
              <span className="text-xs text-neutral-400 flex items-center justify-center gap-1">
                <Ico.Plus /> Tambah
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ModalOverlay title={`Tambah ke ${stages.find(s=>s.id===targetStage)?.label}`} onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Nama Nasabah *</label>
              <input className="field" placeholder="Nama nasabah" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Jumlah KPR (Rp) *</label>
              <input type="number" className="field font-mono" placeholder="500000000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Batal</button>
              <button type="submit" className="btn-primary flex-1">Tambah Card</button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function TasksPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter]   = useState("All");

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now(), title: newTask.trim(), due: "Hari ini",
      priority: "Medium", done: false, tag: "Internal",
    }]);
    setNewTask("");
  };

  const prioColor = { High:"text-red-600", Medium:"text-amber-600", Low:"text-neutral-400" };
  const tagBadge  = (tag) => ({
    "Lead":"badge-blue","Application":"badge-yellow","Pipeline":"badge-green","Internal":"badge-gray",
  }[tag] || "badge-gray");

  const filtered = filter === "All" ? tasks
    : filter === "Selesai" ? tasks.filter(t => t.done)
    : tasks.filter(t => !t.done);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.filter(t=>!t.done).length} tugas aktif`}
      />

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["All","Aktif","Selesai"].map(f => (
          <button
            key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === f ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add task */}
      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <input
          className="field flex-1"
          placeholder="Tambah tugas baru..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <button type="submit" className="btn-primary px-4">Tambah</button>
      </form>

      {/* Task list */}
      <div className="flex flex-col gap-1.5">
        {filtered.map(task => (
          <div
            key={task.id}
            onClick={() => toggle(task.id)}
            className={`card px-4 py-3 flex items-center gap-3 cursor-pointer select-none transition hover:border-neutral-400 ${task.done ? "opacity-50" : ""}`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
              task.done ? "bg-neutral-900 border-neutral-900" : "border-neutral-300 hover:border-neutral-600"
            }`}>
              {task.done && <span className="text-white"><Ico.Check /></span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.done ? "line-through text-neutral-400" : "text-neutral-900"}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-neutral-400">{task.due}</span>
                <span className={tagBadge(task.tag)}>{task.tag}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold shrink-0 ${prioColor[task.priority]}`}>{task.priority}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-neutral-400 text-sm">Tidak ada tugas.</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI AGENT PAGE
// ─────────────────────────────────────────────────────────────────────────────
const AI_RESPONSES = {
  flpp:    "KPR FLPP (Fasilitas Likuiditas Pembiayaan Perumahan) adalah program subsidi pemerintah untuk MBR dengan penghasilan di bawah Rp 8 juta/bulan. Keunggulannya: DP hanya 1%, suku bunga 5% p.a. tetap selama tenor, dan tenor maksimal 20 tahun.",
  dti:     "DTI (Debt-to-Income Ratio) adalah rasio antara total kewajiban utang bulanan dengan penghasilan bruto. Bank Indonesia menetapkan batas maksimal DTI 40% untuk KPR. Jika penghasilan Rp 10 juta/bulan, total cicilan tidak boleh melebihi Rp 4 juta/bulan.",
  dp:      "Down payment KPR Non-Subsidi minimal 10% dari harga properti. Untuk KPR FLPP Subsidi, DP hanya 1%. Semakin besar DP, semakin kecil cicilan bulanan dan semakin rendah risiko kredit macet nasabah.",
  score:   "Affordability Score dihitung dari beberapa komponen: DTI ratio (bobot tertinggi), riwayat kredit, rasio sewa-terhadap-penghasilan, kecukupan penghasilan vs harga pasar lokal, dan jenis pekerjaan. Skor 70+ = Pre-Approved, 45-69 = Pending Review, di bawah 45 = Tidak Disetujui.",
  anuitas: "Sistem anuitas (amortisasi tetap) berarti cicilan bulanan sama setiap bulan selama tenor. Di awal tenor, porsi bunga lebih besar dari pokok. Seiring waktu, porsi pokok meningkat dan bunga menurun. Total cicilan = pokok + bunga kumulatif.",
  default: "Terima kasih atas pertanyaan Anda. Untuk analisis KPR yang lebih spesifik, silakan gunakan fitur Dashboard untuk memilih profil nasabah dan menjalankan analisis lengkap. Saya dapat membantu menjawab pertanyaan tentang FLPP, DTI, DP, scoring, dan regulasi BI.",
};

function AIAgentPage() {
  const [messages, setMessages] = useState([
    { role:"agent", text:"Selamat datang di Hyper Mortgage AI Agent. Saya dapat membantu Anda menganalisis kelayakan KPR, menjelaskan regulasi BI, dan memberikan panduan produk KPR BTN. Silakan ajukan pertanyaan Anda." },
  ]);
  const [input, setInput]     = useState("");
  const [typing, setTyping]   = useState(false);
  const bottomRef = useRef(null);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", text }]);
    setTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      const reply =
        lower.includes("flpp") || lower.includes("subsidi")          ? AI_RESPONSES.flpp    :
        lower.includes("dti") || lower.includes("rasio utang")        ? AI_RESPONSES.dti     :
        lower.includes("dp") || lower.includes("uang muka") || lower.includes("down payment") ? AI_RESPONSES.dp :
        lower.includes("score") || lower.includes("skor")             ? AI_RESPONSES.score   :
        lower.includes("anuitas") || lower.includes("cicilan")        ? AI_RESPONSES.anuitas :
        AI_RESPONSES.default;
      setMessages(prev => [...prev, { role:"agent", text: reply }]);
      setTyping(false);
    }, 800 + Math.random() * 400);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, typing]);

  return (
    <div className="flex flex-col" style={{ height:"calc(100vh - 100px)" }}>
      <PageHeader title="AI Agent" subtitle="Asisten analisis KPR berbasis aturan" />
      <div className="card flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-neutral-900 text-white rounded-br-sm"
                  : "bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-bl-sm"
              }`}>
                {m.role === "agent" && (
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">AI Agent</p>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay:"0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay:"150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay:"300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5">
          {["Apa itu FLPP?","Berapa batas DTI?","Jelaskan sistem anuitas","Bagaimana cara hitung skor?"].map(q => (
            <button
              key={q} type="button"
              onClick={() => { setInput(q); }}
              className="text-[11px] border border-neutral-200 text-neutral-500 rounded-full px-3 py-1 hover:bg-neutral-100 hover:text-neutral-800 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-neutral-200 p-3 flex gap-2">
          <input
            className="field flex-1"
            placeholder="Tanya tentang KPR, DTI, FLPP, anuitas, scoring..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || typing}
            className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-40"
          >
            <Ico.Send /> Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performa dan tren pengajuan KPR" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Leads"          value="301"   sub="+22% dari bulan lalu" />
        <StatCard label="Konversi ke KPR"      value="38.2%" sub="+4% dari bulan lalu"  highlight />
        <StatCard label="Avg. Approval Score"  value="71.4"  sub="+3 poin"              />
        <StatCard label="KPR Dicairkan"        value="88"    sub="+15% dari bulan lalu" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Trend chart */}
        <div className="lg:col-span-2 card p-5">
          <p className="section-label mb-4">Tren 7 Bulan Terakhir</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={ANALYTICS_DATA} margin={{ top:4, right:4, left:0, bottom:4 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#171717" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#737373" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#737373" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:"#a3a3a3" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:"#d4d4d4" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="leads"     name="Leads"      stroke="#171717" fill="url(#gLeads)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="apps"      name="Pengajuan"  stroke="#737373" fill="url(#gApps)"  strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="disbursed" name="Dicairkan"  stroke="#d4d4d4" fill="none"         strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[["Leads","#171717","solid"],["Pengajuan","#737373","solid"],["Dicairkan","#d4d4d4","dashed"]].map(([l,c,s]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ backgroundColor:c, borderStyle:s==="dashed"?"dashed":"solid" }}></div>
                <span className="text-[11px] text-neutral-500">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* District breakdown */}
        <div className="card p-5">
          <p className="section-label mb-4">KPR Dicairkan per Distrik</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DISTRICT_DATA} layout="vertical" margin={{ top:0, right:4, left:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:"#d4d4d4" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:"#737373" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="KPR Dicairkan" radius={[0,3,3,0]}>
                {DISTRICT_DATA.map((_, i) => (
                  <Cell key={i} fill={`rgba(23,23,23,${0.2 + i * 0.13})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="card p-5">
        <p className="section-label mb-4">Funnel Konversi — April 2024</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Leads",      value:47, pct:100 },
            { label:"Pengajuan",  value:29, pct:62  },
            { label:"Review",     value:18, pct:38  },
            { label:"Dicairkan",  value:19, pct:40  },
          ].map(({ label, value, pct }) => (
            <div key={label}>
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-xs font-semibold text-neutral-600">{label}</span>
                <span className="text-lg font-black text-neutral-900">{value}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width:`${pct}%` }} />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">{pct}% dari leads</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPage({ user }) {
  const [saved, setSaved]         = useState(false);
  const [paramSaved, setParamSaved] = useState(false);
  const [profile, setProfile]     = useState({
    fullName: user?.username || "",
    email: "",
    phone: "",
  });
  const [avatar, setAvatar]       = useState(null);
  const fileInputRef              = useRef(null);
  const [params, setParams]       = useState({
    tenor: "240", rate: "7.75", maxDti: "40", dpNonSub: "10", dpFlpp: "1", flppLimit: "8000000",
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saveParams = (e) => {
    e.preventDefault();
    setParamSaved(true);
    setTimeout(() => setParamSaved(false), 2500);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Konfigurasi sistem dan akun" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Account */}
        <div className="card p-5">
          <p className="section-label mb-4">Profil Akun</p>

          {/* Avatar upload */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 rounded-full bg-neutral-200 border-2 border-neutral-300 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatar
                  ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-neutral-900 text-white flex items-center justify-center text-xl font-bold">
                      {(profile.fullName || user?.username || "U")[0].toUpperCase()}
                    </div>
                }
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-neutral-700 transition shadow"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{profile.fullName || user?.username}</p>
              <p className="text-xs text-neutral-500 mb-1">Loan Officer</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-neutral-600 underline hover:text-neutral-900 transition"
              >
                Upload foto profil
              </button>
            </div>
          </div>

          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Nama Lengkap</label>
              <input
                className="field"
                placeholder="Masukkan nama lengkap"
                value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Email</label>
              <input
                type="email"
                className="field"
                placeholder="email@perusahaan.com"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">No. Telepon</label>
              <input
                type="tel"
                className="field"
                placeholder="0812-xxxx-xxxx"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <button type="submit" className={`btn-primary mt-1 flex items-center justify-center gap-1.5 transition-colors ${saved ? "bg-emerald-600" : ""}`}>
              {saved ? <><Ico.Check /> Tersimpan</> : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        {/* KPR Parameters */}
        <div className="card p-5">
          <p className="section-label mb-4">Parameter KPR</p>
          <form onSubmit={saveParams} className="flex flex-col gap-3">
            {[
              ["Tenor (bulan)",             "tenor",    "240"      ],
              ["Suku Bunga Tahunan (%)",    "rate",     "7.75"     ],
              ["Maks. DTI (%)",             "maxDti",   "40"       ],
              ["DP Non-Subsidi (%)",        "dpNonSub", "10"       ],
              ["DP FLPP (%)",               "dpFlpp",   "1"        ],
              ["Batas Penghasilan FLPP",    "flppLimit","8000000"  ],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">{label}</label>
                <input
                  className="field font-mono"
                  value={params[key]}
                  placeholder={placeholder}
                  onChange={e => setParams(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button type="submit" className={`btn-primary mt-1 flex items-center justify-center gap-1.5 transition-colors ${paramSaved ? "bg-emerald-600" : ""}`}>
              {paramSaved ? <><Ico.Check /> Tersimpan</> : "Update Parameter"}
            </button>
          </form>
        </div>

        {/* System info */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-label mb-4">Informasi Sistem</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Versi","2.0.0"],
              ["Backend","FastAPI 0.111.1"],
              ["Database","In-Memory JSON"],
              ["Nasabah Dimuat","15"],
              ["Distrik Properti","10"],
              ["API Status","Aktif"],
              ["Regulasi Ref.","BI 17/10/PBI/2015"],
              ["Data Tahun","2024"],
            ].map(([k,v]) => (
              <div key={k} className="card2 rounded-lg p-3">
                <p className="text-[10px] text-neutral-400 mb-0.5">{k}</p>
                <p className="text-xs font-mono font-bold text-neutral-800">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth]       = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("hmat_user")) || null; } catch { return null; }
  });
  const [page, setPage]           = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Load customers from backend whenever auth is available
  useEffect(() => {
    if (!auth) return;
    axios.get(`${API}/api/customers`)
      .then(res => {
        if (res.data?.customers) setCustomers(res.data.customers);
      })
      .catch(() => {
        setLoadError("Tidak dapat menghubungi backend. Fitur analisis KPR tidak tersedia.");
      });
  }, [auth]);

  const login  = (user) => { setAuth(user); sessionStorage.setItem("hmat_user", JSON.stringify(user)); };
  const logout = () => { setAuth(null); sessionStorage.removeItem("hmat_user"); setPage("dashboard"); };

  if (!auth) return <LoginPage onLogin={login} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":    return <DashboardPage customers={customers} />;
      case "leads":        return <LeadsPage />;
      case "applications": return <ApplicationsPage />;
      case "pipeline":     return <PipelinePage />;
      case "tasks":        return <TasksPage />;
      case "ai-agent":     return <AIAgentPage />;
      case "analytics":    return <AnalyticsPage />;
      case "settings":     return <SettingsPage user={auth} />;
      default:             return <DashboardPage customers={customers} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar page={page} setPage={setPage} user={auth} onLogout={logout} />
      <main className="flex-1 overflow-y-auto bg-neutral-50">
        {loadError && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-700 font-medium">
            {loadError}
          </div>
        )}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
