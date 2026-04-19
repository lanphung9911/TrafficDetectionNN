import json, csv

from fastapi import APIRouter
from ..config import DATAREF_FILE_PATH_CSV, DATAREF_FILE_PATH_JSON
from .write2json import overwrite_to_json

ref_data_router = APIRouter()

### should get data from database, but here we just return a static data for demonstration ###
@ref_data_router.get("/api/ref_data/get")
async def get_ref_data_endpoint():
    rows_json = []

    # read csv file and return the data as a list of dictionaries
    with open(DATAREF_FILE_PATH_CSV, mode="r", encoding="utf-8", newline="") as csvfile:
        # Nếu CSV phân tách bằng ";" thì thêm delimiter=";"
        reader = csv.DictReader(csvfile, delimiter=";")

        for row in reader:
            item_json = {
                "img": row.get("img", ""),
                "title": row.get("title", ""),
                "description": row.get("description", "")
            }
            rows_json.append(item_json)

    # write the data to a json file
    overwrite_to_json(rows_json, DATAREF_FILE_PATH_JSON)

    return rows_json