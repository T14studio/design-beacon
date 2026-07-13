import asyncio
from main import handle_turn, TurnPayload
import httpx

class MockRequest:
    class Client:
        host = "127.0.0.1"
    client = Client()

async def test_route(message, title):
    payload = TurnPayload(
        browser_user_id="test_local_browser_01",
        message=message,
        property_code="1",
        optional_context={"property_title": title}
    )
    req = MockRequest()
    res = await handle_turn(payload, req)
    print(f"Message: {message}")
    print(f"Setor: {res.setor_destino}")
    print(f"Prioridade: {res.prioridade}")
    print(f"CTAs: {res.sugestoes_de_cta}\n")

async def main():
    await test_route("quero comprar um imóvel", "Oásis")
    await test_route("preciso enviar minha documentação", "Oásis")
    await test_route("preciso da segunda via do boleto", "Oásis")
    await test_route("estou com um vazamento urgente", "Oásis")

if __name__ == "__main__":
    asyncio.run(main())
