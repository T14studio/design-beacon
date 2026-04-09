import requests, time

BASE = "http://localhost:8000"

def turn(user_id, msg, session_id=None, prop_code=None, prop_ctx=None):
    payload = {
        "channel": "website",
        "browser_user_id": user_id,
        "message": msg,
        "session_id": session_id,
        "optional_context": prop_ctx or {}
    }
    if prop_code:
        payload["property_code"] = prop_code
    r = requests.post(f"{BASE}/axis/turn", json=payload, timeout=30)
    return r.json()

print("=== TESTE D: COMERCIAL ===")
d1 = turn("test-comercial-001", "quero comprar um imovel")
print(f"Comprar: {d1['reply'][:150]}")
print(f"  setor={d1.get('setor_destino')}")
if d1.get("setor_destino") == "comercial":
    print("  >> OK: comercial")
else:
    print(f"  >> FALHA: setor={d1.get('setor_destino')}")

d2 = turn("test-comercial-002", "preciso financiar minha compra", session_id=None)
print(f"Financiar: {d2['reply'][:150]}")
print(f"  setor={d2.get('setor_destino')}")

d3 = turn("test-comercial-003", "quero visitar um imovel amanha")
print(f"Visita: {d3['reply'][:150]}")
print(f"  setor={d3.get('setor_destino')} | prio={d3.get('prioridade')}")

print()
print("=== TESTE E: ADMINISTRATIVO ===")
e1 = turn("test-admin-001", "estou com um vazamento urgente")
print(f"Vazamento: {e1['reply'][:150]}")
print(f"  setor={e1.get('setor_destino')} | prio={e1.get('prioridade')}")
if e1.get("setor_destino") == "administrativo" and e1.get("prioridade") == "alta":
    print("  >> OK: urgencia administrativa")
else:
    print(f"  >> Parcial: setor={e1.get('setor_destino')} prio={e1.get('prioridade')}")

e2 = turn("test-admin-002", "quero rescindir meu contrato")
print(f"Rescisao: {e2['reply'][:150]}")
print(f"  setor={e2.get('setor_destino')}")
if e2.get("setor_destino") == "administrativo":
    print("  >> OK: rescisao -> administrativo")
else:
    print(f"  >> FALHA: setor={e2.get('setor_destino')}")

e3 = turn("test-admin-003", "preciso enviar minha documentacao para o contrato")
print(f"Docs: {e3['reply'][:150]}")
print(f"  setor={e3.get('setor_destino')}")

print()
print("=== TESTE F: FINANCEIRO ===")
f1 = turn("test-fin-001", "preciso da segunda via do meu boleto")
print(f"Boleto: {f1['reply'][:150]}")
print(f"  setor={f1.get('setor_destino')}")
if f1.get("setor_destino") == "financeiro":
    print("  >> OK: boleto -> financeiro")
else:
    print(f"  >> FALHA: setor={f1.get('setor_destino')}")

f2 = turn("test-fin-002", "quero saber do meu repasse de outubro")
print(f"Repasse: {f2['reply'][:150]}")
print(f"  setor={f2.get('setor_destino')} | repasse_flag={f2.get('repasse_ou_extrato_solicitado')}")
if f2.get("setor_destino") == "financeiro":
    print("  >> OK: repasse -> financeiro")
else:
    print(f"  >> FALHA: setor={f2.get('setor_destino')}")

f3 = turn("test-fin-003", "estao me cobrando juros errados no boleto")
print(f"Juros: {f3['reply'][:150]}")
print(f"  setor={f3.get('setor_destino')}")

print()
print("=== TESTE G: ROTEAMENTO COMPLETO ===")
cases = [
    ("test-g-001", "estou com juros errados na cobranca", "financeiro"),
    ("test-g-002", "preciso enviar minha documentacao", "administrativo"),
    ("test-g-003", "quero anunciar meu imovel", "comercial"),
    ("test-g-004", "preciso da segunda via do boleto de outubro", "financeiro"),
    ("test-g-005", "tem manutencao para fazer no meu apartamento", "administrativo"),
    ("test-g-006", "quero fazer uma proposta de compra", "comercial"),
    ("test-g-007", "preciso do extrato para meu imposto de renda", "financeiro"),
    ("test-g-008", "quando vence meu contrato?", "administrativo"),
]
for uid, msg, expected in cases:
    rx = turn(uid, msg)
    actual = rx.get("setor_destino")
    ok = "OK" if actual == expected else f"FALHA(got={actual})"
    print(f"  [{ok}] '{msg[:40]}' -> {actual} (esperado: {expected})")
