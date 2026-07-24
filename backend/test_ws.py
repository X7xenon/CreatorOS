import asyncio
import websockets
import json

async def test():
    uri = "ws://127.0.0.1:8888/ws/telemetry"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            for i in range(3):
                data = await websocket.recv()
                print("Received:", data)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
