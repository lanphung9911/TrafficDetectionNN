from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

predict_vid_router = APIRouter()

async def get_latest_prediction_vid():
    return {
        "traffic_sign_1": "parking",
        "traffic_sign_2": "right_turn",
        "traffic_sign_3": "stop",
        "traffic_sign_4": "none-stop",
        "traffic_sign_5": "no_entry",
        "percent_of_total_1": 33,
        "percent_of_total_2": 50,
        "percent_of_total_3": 10,
        "percent_of_total_4": 5,
        "percent_of_total_5": 3,
        "count_1": 60,
        "count_2": 42,
        "count_3": 23,
        "count_4": 12,
        "count_5": 8,
        "total_count": 102,
        "confidence": 71.1,
    }


@predict_vid_router.websocket("/ws/predict_vid")
async def ws_predict_vid_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await get_latest_prediction_vid()
            if data is not None:
                await websocket.send_json(data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        # Client disconnected; end loop quietly.
        return