const DEFAULT_AVATAR = "\u{1F9D1}\u{1F3FE}\u200D\u{1F4BB}";
const DEFAULT_AVATAR_CLASS = "avatar-blue";

const typeClassMap = {
  "MISS DETECTION": "pill-pink",
  "HIGH ACCURACY": "pill-green",
  "WRONG DETECTION": "pill-red",
};

const statusToClass = (status) => {
  if (!status) return "pill-pending";
  const s = status.toLowerCase();
  if (s === "replied") return "pill-replied";
  if (s === "analyze" || s === "analyzing") return "pill-analyze";
  if (s === "spam") return "pill-spam";
  if (s === "close") return "pill-close";
  return "pill-pending";
};

export async function fetchAdminFeedback(apiBaseUrl, { includeArchived = false } = {}) {
  const res = await fetch(`${apiBaseUrl}/api/admin/feedback`);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Failed to fetch feedback");
  }
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  const visible = arr.filter(item => {
    const s = (item.status || "").toLowerCase();
    return includeArchived ? true : (s !== "close" && s !== "spam");
  });
  return visible.map((item, idx) => ({
    name: item.email_name,
    avatar: DEFAULT_AVATAR,
    avatarClass: DEFAULT_AVATAR_CLASS,
    rating: item.rating,
    type: item.evaluateOption,
    typeClass: typeClassMap[item.evaluateOption] || "pill-pink",
    attachment: item.attachFile || "no file",
    attachmentClass: item.attachFile ? "attachment-icon-active" : "attachment-icon-empty",
    status: item.status,
    statusClass: statusToClass(item.status),
    featured: idx === 0,
    feedbackText: item.feedbackText,
    date: item.date,
    time: item.time,
    timestamp: item.timestamp,
    reply: item.reply
  }));
}

export async function fetchArchiveFeedback(apiBaseUrl) {
  const res = await fetch(`${apiBaseUrl}/api/admin/feedback`);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Failed to fetch feedback");
  }
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [];
  const visible = arr.filter(item => {
    const s = (item.status || "").toLowerCase();
    return s === "close" || s === "spam";
  });
  return visible.map((item, idx) => ({
    name: item.email_name,
    avatar: DEFAULT_AVATAR,
    avatarClass: DEFAULT_AVATAR_CLASS,
    rating: item.rating,
    type: item.evaluateOption,
    typeClass: typeClassMap[item.evaluateOption] || "pill-pink",
    attachment: item.attachFile || "no file",
    attachmentClass: item.attachFile ? "attachment-icon-active" : "attachment-icon-empty",
    status: item.status,
    statusClass: statusToClass(item.status),
    featured: idx === 0,
    feedbackText: item.feedbackText,
    date: item.date,
    time: item.time,
    timestamp: item.timestamp,
    reply: item.reply
  }));
}

export async function sendAdminReply(apiBaseUrl, payload) {
  /* payload: 
  { admin_email, user_email, timestamp, replyText?, status? } */
  const body = {
    admin_email: payload.admin_email,
    user_email: payload.user_email,
    timestamp: payload.timestamp,
  };
  // include replyText only if provided (allow empty string to clear)
  if (Object.prototype.hasOwnProperty.call(payload, "replyText")) {
    body.replyText = payload.replyText;
  }
  if (payload.status) body.status = payload.status;

  const res = await fetch(`${apiBaseUrl}/api/admin/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || "Request failed");
  }
  return await res.json();
}

export async function getFeedbackDetails(apiBaseUrl, email_name) {
  const res = await fetch(`${apiBaseUrl}/api/logs/${encodeURIComponent(email_name)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || "Failed to fetch feedback details");
  }
  return await res.json();
}