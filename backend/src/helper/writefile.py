# helper function to create empty json files if not exist, to avoid file not found error when writing feedback data to json file
import json
import os
import csv

'''    init an empty json file if not exist, to avoid file not found error when writing feedback data to json file  '''
def init_json_file(file_path):
    file_path = file_path.replace("\\", "/")
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump([], f)

'''    init an empty csv file if not exist, to avoid file not found error when writing feedback data to csv file  '''
def init_csv_file(file_path, headers):
    file_path = file_path.replace("\\", "/")
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8", newline="") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()

'''    overwrite an existing json file with new data  '''
def overwrite_to_json(new_data, file_path):
    file_path = file_path.replace("\\", "/")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=4)

'''    append new data to an existing json file  '''
def append_to_json(new_data, file_path):
    file_path = file_path.replace("\\", "/")
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

def overwrite_to_csv(new_data, file_path, headers):
    file_path = file_path.replace("\\", "/")
    init_csv_file(file_path, headers)
    
    with open(file_path, "w", encoding="utf-8", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        if isinstance(new_data, list):
            writer.writerows(new_data)
        else:
            writer.writerow(new_data)