/* Once click on Video submit, the video file will be sent to the backend server and the response will be returned to the frontend. */
export async function handleVideoSubmit(file) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("filesize", file.size);

  const res = await fetch(`${baseUrl}/api/video/upload_video`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

/* Once click on Video option, the video option will be sent to the backend server and the response will be returned to the frontend. */
export async function handleVideoOption(option_fps, option_speed) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const res = await fetch(`${baseUrl}/api/video/set_option`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "VideoOption",
      value: {
        FPS: option_fps,
        Speed: option_speed,
      },
    }),
  });

  return res.json();
}

/* Once click on Folder select, the video files in the folder will be sent to the backend server and the response will be returned to the frontend. */
export async function handleFolderSelect(files) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const formDatas = new FormData();

  for (let i = 0; i < files.length; i++) {
    formDatas.append("files", files[i]);
    formDatas.append("paths", files[i].webkitRelativePath);
  }

  const res = await fetch(`${baseUrl}/api/video/upload_folder`, {
    method: "POST",
    body: formDatas,
  });

  const data = await res.json();

  localStorage.setItem("videos", JSON.stringify(data.files));

  return data;
}