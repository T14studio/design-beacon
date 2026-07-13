import asyncio
from main import handle_turn, TurnPayload
import httpx

class MockRequest:
    class Client:
        host = "127.0.0.1"
    client = Client()

async def main():
    payload1 = TurnPayload(
        browser_user_id="test_local_browser_01",
        message="quero ver mais fotos",
        property_code="1",
        optional_context={"property_title": "Empreendimento Oásis"}
    )
    req = MockRequest()
    res = await handle_turn(payload1, req)
    print(f"Reply: {res.reply}")
    print(f"Fotos Flag: {res.exibir_fotos_galeria}")

if __name__ == "__main__":
    asyncio.run(main())
