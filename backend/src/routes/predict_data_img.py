from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

predict_img_router = APIRouter()

async def get_latest_prediction_img():
    return {
        "traffic_sign_1": "left_turn",
        "traffic_sign_2": "stop",
        "traffic_sign_3": "walk",
        "traffic_sign_4": "storm",
        "traffic_sign_5": "no_entry",
        "percent_of_total_1": 55,
        "percent_of_total_2": 32,
        "percent_of_total_3": 22,
        "percent_of_total_4": 12,
        "percent_of_total_5": 4,
        "count_1": 80,
        "count_2": 52,
        "count_3": 33,
        "count_4": 22,
        "count_5": 18,
        "total_count": 311,
        "confidence": 71.1,
    }


@predict_img_router.websocket("/ws/predict_img")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await get_latest_prediction_img()
            if data is not None:
                await websocket.send_json(data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        # Client disconnected; end loop quietly.
        return