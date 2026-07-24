import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8001/api/v1/ws/ws"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket.")
            for _ in range(2):
                message = await websocket.recv()
                data = json.loads(message)
                print(f"Received: {data}")
    except Exception as e:
        print(f"WebSocket Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
