import requests

BASE = "http://localhost:8000"
USER_ID = "test-antonio-001"

def turn(msg, session_id=None, name=None, prop_code=None, prop_ctx=None):
    payload = {
        "channel": "website",
        "browser_user_id": USER_ID,
        "message": msg,
        "session_id": session_id,
        "name": name,
        "optional_context": prop_ctx or {}
    }
    if prop_code:
        payload["property_code"] = prop_code
    r = requests.post(f"{BASE}/axis/turn", json=payload, timeout=30)
    return r.json()

print("=== TESTE A: NOME / MEMORIA ===")
r1 = turn("Ola!")
sid = r1.get("session_id")
print(f"Saudacao: {r1['reply'][:100]}")

r2 = turn("Antonio", session_id=sid)
print(f"Apos nome: {r2['reply'][:200]}")
print(f"  nome_cliente retornado: {r2.get('nome_cliente')}")
print(f"  estado: {r2.get('current_state')}")

r3 = turn("Quero agendar uma visita", session_id=sid)
print(f"Apos visita: {r3['reply'][:200]}")
print(f"  nome ainda: {r3.get('nome_cliente')}")
print(f"  estado: {r3.get('current_state')}")
print(f"  CTAs: {r3.get('sugestoes_de_cta')}")

if "nome" in r3["reply"].lower() and "qual" in r3["reply"].lower():
    print("  >> FALHA: Axis pediu nome novamente!")
else:
    print("  >> OK: Axis nao pediu nome novamente")

print()
print("=== TESTE B: IMOVEL ESPECIFICO ===")
ctx = {
    "property_id": "prop-001",
    "property_title": "Flat Prime Itaim",
    "property_mode": "Venda",
    "property_type": "Apartamento",
    "price": 1200000
}
r4 = turn("tenho interesse nesse imovel", prop_code="prop-001", prop_ctx=ctx)
sid2 = r4.get("session_id")
print(f"Resposta: {r4['reply'][:250]}")
rep = r4["reply"].lower()
if "flat prime" in rep or "itaim" in rep:
    print("  >> OK: Imovel mencionado")
else:
    print("  >> FALHA: Imovel NAO mencionado na resposta")
if "locacao" in rep or "locacao" in rep or ("compra" in rep and "locação" in rep):
    print("  >> FALHA: Perguntou compra/locacao indevidamente")
else:
    print("  >> OK: Nao perguntou compra/locacao")

print()
print("=== TESTE C: FOTOS ===")
r5 = turn("quero ver mais fotos", session_id=sid2, prop_code="prop-001", prop_ctx=ctx)
print(f"Resposta: {r5['reply'][:150]}")
print(f"  exibir_fotos_galeria: {r5.get('exibir_fotos_galeria')}")
if r5.get("exibir_fotos_galeria"):
    print("  >> OK: Galeria ativada")
else:
    print("  >> FALHA: Galeria nao ativada")

print()
print("=== TESTE D: COMERCIAL ===")
r6 = turn("quero comprar um imovel")
print(f"Resposta: {r6['reply'][:150]}")
print(f"  setor: {r6.get('setor_destino')}")
if r6.get("setor_destino") == "comercial":
    print("  >> OK: Roteado para comercial")
else:
    print(f"  >> Parcial: setor={r6.get('setor_destino')}")

r6b = turn("preciso financiar", session_id=r6.get("session_id"))
print(f"Financiamento: {r6b['reply'][:150]}")
print(f"  setor: {r6b.get('setor_destino')}")

print()
print("=== TESTE E: ADMINISTRATIVO ===")
r7 = turn("estou com um vazamento urgente")
print(f"Vazamento: {r7['reply'][:150]}")
print(f"  setor: {r7.get('setor_destino')} | prioridade: {r7.get('prioridade')}")
if r7.get("setor_destino") == "administrativo" and r7.get("prioridade") == "alta":
    print("  >> OK: Urgencia detectada")
else:
    print(f"  >> Parcial: setor={r7.get('setor_destino')} prio={r7.get('prioridade')}")

r8 = turn("quero rescindir meu contrato")
print(f"Rescisao: {r8['reply'][:150]}")
print(f"  setor: {r8.get('setor_destino')}")
if r8.get("setor_destino") == "administrativo":
    print("  >> OK: Rescisao -> administrativo")
else:
    print(f"  >> FALHA: setor={r8.get('setor_destino')}")

print()
print("=== TESTE F: FINANCEIRO ===")
r9 = turn("preciso da segunda via do meu boleto")
print(f"Boleto: {r9['reply'][:150]}")
print(f"  setor: {r9.get('setor_destino')}")
if r9.get("setor_destino") == "financeiro":
    print("  >> OK: Roteado para financeiro")
else:
    print(f"  >> FALHA: setor={r9.get('setor_destino')}")

r10 = turn("quero saber do meu repasse")
print(f"Repasse: {r10['reply'][:150]}")
print(f"  setor: {r10.get('setor_destino')}")
print(f"  repasse_flag: {r10.get('repasse_ou_extrato_solicitado')}")
if r10.get("setor_destino") == "financeiro":
    print("  >> OK: Repasse -> financeiro")
else:
    print(f"  >> FALHA: setor={r10.get('setor_destino')}")

print()
print("=== TESTE G: ROTEAMENTO GERAL ===")
cases = [
    ("estou com juros errados na cobranca", "financeiro"),
    ("preciso enviar minha documentacao", "administrativo"),
    ("quero anunciar meu imovel", "comercial"),
    ("preciso da segunda via do boleto de outubro", "financeiro"),
    ("tem manutencao para fazer no meu apartamento", "administrativo"),
]
for msg, expected in cases:
    rx = turn(msg)
    actual = rx.get("setor_destino")
    status = "OK" if actual == expected else f"FALHA (got {actual})"
    print(f"  [{status}] '{msg[:40]}' -> {actual} (expected {expected})")
