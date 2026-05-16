/* Once click on Folder select, the folder files in the folder will be sent to the backend server and the response will be returned to the frontend. */
export async function handleFolderSelect(files) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const formDatas = new FormData();

  for (let i = 0; i < files.length; i++) {
    formDatas.append("files", files[i]);
    formDatas.append("paths", files[i].webkitRelativePath);
    formDatas.append("root_path", files[0].webkitRelativePath.split("/")[0]);
  }

  const res = await fetch(`${baseUrl}/api/input/upload_folder`, {
    method: "POST",
    body: formDatas,
  });

  const data = await res.json();

  localStorage.setItem("input", JSON.stringify(data.files));

  return data;
}