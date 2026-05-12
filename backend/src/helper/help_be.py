# helper function to create empty json files if not exist, to avoid file not found error when writing feedback data to json file
import json
import os
import csv

def init_json_file(file_path):
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump([], f)

def init_csv_file(file_path, headers):
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8", newline="") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()