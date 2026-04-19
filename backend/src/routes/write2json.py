import json
import os

def write_to_json(new_data, file_path):
    # create parent directory and file if not exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            json.dump([], f)

    # read old data, nếu lỗi thì dùng []
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        data = []

    # add new data
    
    data.append(new_data)

    # write back
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def overwrite_to_json(new_data, file_path):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=4)