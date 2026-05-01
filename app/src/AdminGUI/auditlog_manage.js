const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchAnalysisLogs(systemVersion) {
  const url = `${API_BASE}/api/analysis-logs/${encodeURIComponent(systemVersion)}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
  if (res.status === 404) return { audit_logs: [], system_version: systemVersion };
  throw new Error(`Server error ${res.status}`);
  }

  const payload = await res.json();
  let logs = payload.logs ?? [];

  if (typeof logs === "string") {
    try { logs = JSON.parse(logs); } catch (_) { logs = [logs]; }
  }
  if (!Array.isArray(logs)) logs = [logs];

  return { audit_logs: logs, system_version: payload.system_version ?? systemVersion };
}
