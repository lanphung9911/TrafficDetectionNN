import json
import os

def write_to_json(new_data, file_path):
    # create parent directory and file if not exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            json.dump([], f)

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

def append_to_json(new_data, file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                data = []
    except (json.JSONDecodeError, FileNotFoundError):
        data = []

    if isinstance(new_data, list):
        data.extend(new_data)
    else:
        data.append(new_data)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)