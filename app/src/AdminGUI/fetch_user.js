export async function fetchUserInfo() {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const res = await fetch(`${baseUrl}/api/auth/userinfo`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return res.json();
}

export async function deleteUser(email) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const url = `${baseUrl}/api/auth/userinfo/${encodeURIComponent(email)}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Delete failed (${res.status})`);
  }
  return res.json().catch(() => ({ ok: true }));
}