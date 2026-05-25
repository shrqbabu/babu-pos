// Utility helpers used across SmartPOS
export const fmtMoney = (n: number, currency = "₹") =>
  `${currency}${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (ts: number) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtTime = (ts: number) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export const fmtDateTime = (ts: number) => `${fmtDate(ts)} • ${fmtTime(ts)}`;

export const startOfDay = (d = new Date()) => {
  const x = new Date(d); x.setHours(0,0,0,0); return x.getTime();
};
export const startOfWeek = (d = new Date()) => {
  const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x.getTime();
};
export const startOfMonth = (d = new Date()) => {
  const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x.getTime();
};

export const generateOrderNo = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `INV-${stamp}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
};

export const downloadCSV = (filename: string, rows: (string|number)[][]) => {
  const csv = rows.map(r =>
    r.map(v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes("\"") || s.includes("\n") ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
