export async function handleFeedback({ email_name, rating, evaluateOption, attachFile, feedbackText }) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const res = await fetch(`${baseUrl}/api/user/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email_name,
      rating,
      evaluateOption,
      attachFile: attachFile?.name ?? null,
      feedbackText,
    }),
  });

  const data = await res.json();
  return data;
}

export async function fetchFeedback({email_name}) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const res = await fetch(`${baseUrl}/api/user/feedback/${email_name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  return data;
}