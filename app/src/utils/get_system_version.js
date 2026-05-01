export async function getSystemVersion() {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  let res;

  try {
    res = await fetch(`${baseUrl}/version`);

  } catch (err) {
    throw new Error("Cannot reach server. Is the backend running?");
  }

  const data = await res.json();
    
  if (!res.ok) {
      throw new Error(`Server responded ${res.status}`);
    }
  
  return data.system_version;
}