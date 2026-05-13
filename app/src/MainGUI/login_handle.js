/* this function will handle the login logic, send a POST request to the backend with the email, password, and role */
export async function handleLogin({ email, password, role }) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  let res;
  try {
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role: role,
      }),
    });
  } catch (networkErr) {
    throw new Error("Cannot reach server. Is the backend running?");
  }

  const data = await res.json();

  if (!res.ok) {
    /* FastAPI 422 returns detail as an array of {msg, loc, type, ...}.
       For 4xx/5xx with HTTPException, detail is a string. Normalize both. */
    let message = "Login failed";
    if (Array.isArray(data.detail)) {
      message = data.detail
        .map((e) => (e && typeof e.msg === "string" ? e.msg : null))
        .filter(Boolean)
        .join(" ") || message;
    } else if (typeof data.detail === "string") {
      message = data.detail;
    } else if (typeof data.message === "string") {
      message = data.message;
    }
    throw new Error(message);
  }

  return data;
}