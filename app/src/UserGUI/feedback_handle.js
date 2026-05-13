export async function handleFeedback({ email_name, rating, evaluateOption, attachFile, feedbackText }) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const formData = new FormData();
  formData.append("email_name", email_name);
  formData.append("rating", rating);
  formData.append("evaluateOption", evaluateOption);
  formData.append("feedbackText", feedbackText);

  if (attachFile) {
    formData.append("attachFile", attachFile);
  }

  const res = await fetch(`${baseUrl}/api/user/feedback`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export async function fetchFeedback({email_name}) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const res = await fetch(`${baseUrl}/api/user/feedback/${email_name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.json();
}