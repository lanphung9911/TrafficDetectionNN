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
    throw new Error(data.detail || data.message || "Login failed");
  }

  return data;
}