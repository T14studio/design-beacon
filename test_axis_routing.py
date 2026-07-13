import asyncio
import httpx
import json

async def main():
    session_id = "test_commercial_flow_01"
    browser_id = "test_browser_id_01"
    url = "http://localhost:8000/axis/turn"

    print("--- TURN 1 ---")
    payload1 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "quero ver mais fotos",
        "session_id": session_id,
        "property_code": "1",
        "optional_context": {
            "property_title": "Empreendimento Oásis",
            "images": ["img1.jpg", "img2.jpg"]
        }
    }
    async with httpx.AsyncClient() as client:
        r1 = await client.post(url, json=payload1, timeout=30.0)
        res1 = r1.json()
        print(f"Reply: {res1.get('reply')}")
        print(f"Fotos Flag: {res1.get('exibir_fotos_galeria')}")

    print("\n--- TURN 2 ---")
    payload2 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "quero comprar um imóvel",
        "session_id": session_id,
        "property_code": "1"
    }
    async with httpx.AsyncClient() as client:
        r2 = await client.post(url, json=payload2, timeout=30.0)
        res2 = r2.json()
        print(f"Reply: {res2.get('reply')}")
        print(f"Setor: {res2.get('setor_destino')}")
        print(f"CTAs: {res2.get('sugestoes_de_cta')}")

    print("\n--- TURN 3 ---")
    payload3 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "preciso enviar minha documentação",
        "session_id": session_id,
        "property_code": "1"
    }
    async with httpx.AsyncClient() as client:
        r3 = await client.post(url, json=payload3, timeout=30.0)
        res3 = r3.json()
        print(f"Setor: {res3.get('setor_destino')}")
        print(f"CTAs: {res3.get('sugestoes_de_cta')}")

    print("\n--- TURN 4 ---")
    payload4 = {
        "channel": "website",
        "browser_user_id": browser_id,
        "message": "estou com um vazamento urgente",
        "session_id": session_id,
        "property_code": "1"
    }
    async with httpx.AsyncClient() as client:
        r4 = await client.post(url, json=payload4, timeout=30.0)
        res4 = r4.json()
        print(f"Setor: {res4.get('setor_destino')}")
        print(f"Prioridade: {res4.get('prioridade')}")
        print(f"CTAs: {res4.get('sugestoes_de_cta')}")

if __name__ == "__main__":
    asyncio.run(main())
