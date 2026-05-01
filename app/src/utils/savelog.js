export async function saveLogs(email_name, logs) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const url = `${baseUrl}/api/logs/${encodeURIComponent(email_name)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_name: email_name,
      recordlogs: logs
    }),
  });

  return res.json();
}