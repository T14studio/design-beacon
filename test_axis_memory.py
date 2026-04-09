import asyncio
import httpx
import json

async def main():
    session_id = "test_memory_session_01"
    browser_id = "test_browser_id_01"
    url = "http://localhost:8000/axis/turn"

    print("--- TURN 1 ---")
    payload1 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "oi",
        "session_id": session_id,
        "property_code": "1",
        "optional_context": {
            "property_title": "Empreendimento Oásis"
        }
    }
    async with httpx.AsyncClient() as client:
        r1 = await client.post(url, json=payload1, timeout=30.0)
        res1 = r1.json()
        print(f"Reply: {res1.get('reply')}")
        print(f"State: {res1.get('current_state')}")

    print("\n--- TURN 2 ---")
    payload2 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "meu nome é Antonio",
        "session_id": session_id,
        "property_code": "1"
    }
    async with httpx.AsyncClient() as client:
        r2 = await client.post(url, json=payload2, timeout=30.0)
        res2 = r2.json()
        print(f"Reply: {res2.get('reply')}")
        print(f"State: {res2.get('current_state')}")
        print(f"Name detected: {res2.get('nome_cliente')}")

    print("\n--- TURN 3 ---")
    payload3 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "tenho interesse nesse imóvel",
        "session_id": session_id,
        "property_code": "1"
    }
    async with httpx.AsyncClient() as client:
        r3 = await client.post(url, json=payload3, timeout=30.0)
        res3 = r3.json()
        print(f"Reply: {res3.get('reply')}")
        print(f"State: {res3.get('current_state')}")

if __name__ == "__main__":
    asyncio.run(main())
