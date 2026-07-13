import time
import re
import sys
from collections import defaultdict
from typing import Dict, List, Tuple
import os

# Estrutura simples em memória para Rate Limiting (sem necessidade de Redis para escala inicial)
# Formato: { key: [timestamp1, timestamp2, ...] }
_request_history: Dict[str, List[float]] = defaultdict(list)


def sanitize_id(value: str) -> str:
    """
    Remove todos os caracteres fora do conjunto alfanumérico + hífen + underscore.
    Impede injeção de parâmetros em URLs da API Supabase REST.
    Limite de 128 caracteres para prevenir buffer abuse.
    """
    if not value:
        return ""
    return re.sub(r"[^a-zA-Z0-9\-_]", "", str(value))[:128]


def sanitize_text_input(value: str, max_length: int = 2000) -> str:
    """
    Limpa campos de texto livre.
    Remove caracteres de controle (exceto newline/tab) e limita o comprimento.
    """
    if not value:
        return ""
    # Remove caracteres de controle que não sejam \n ou \t
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(value))
    return cleaned[:max_length]


class RateLimiter:
    @staticmethod
    def is_rate_limited(key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Verifica se a chave excedeu o limite de requisições na janela de tempo.
        Retorna (is_limited, retry_after_seconds).
        """
        now = time.time()

        # Limpa timestamps antigos fora da janela
        _request_history[key] = [t for t in _request_history[key] if now - t < window_seconds]

        if len(_request_history[key]) >= max_requests:
            earliest_request = _request_history[key][0]
            retry_after = int(window_seconds - (now - earliest_request))
            return True, max(1, retry_after)

        _request_history[key].append(now)
        return False, 0


def check_rate_limit(ip: str, browser_user_id: str) -> Tuple[bool, str, int]:
    """
    Executa a verificação de segurança combinada (IP + User ID).
    Configurações vindas de variáveis de ambiente.
    """
    LIMIT_USER = int(os.getenv("RATELIMIT_USER_MAX", "5"))
    WINDOW_USER = int(os.getenv("RATELIMIT_USER_WINDOW", "60"))

    LIMIT_IP = int(os.getenv("RATELIMIT_IP_MAX", "15"))
    WINDOW_IP = int(os.getenv("RATELIMIT_IP_WINDOW", "60"))

    # 1. Verifica Limite por User ID
    is_limited, retry = RateLimiter.is_rate_limited(f"user:{browser_user_id}", LIMIT_USER, WINDOW_USER)
    if is_limited:
        return True, "Limite de mensagens excedido para sua sessão.", retry

    # 2. Verifica Limite por IP
    is_limited, retry = RateLimiter.is_rate_limited(f"ip:{ip}", LIMIT_IP, WINDOW_IP)
    if is_limited:
        return True, "Muitas requisições vindas deste endereço de IP.", retry

    return False, "", 0


def check_contracts_rate_limit(ip: str) -> Tuple[bool, str, int]:
    """
    Rate limit estrito para o endpoint /client-area/contracts/search.
    Esse endpoint aceita CPF/CNPJ e retorna contratos — alto risco de enumeração.
    Limita a 3 consultas por IP por 60 segundos (configurável via .env).
    """
    LIMIT_IP = int(os.getenv("RATELIMIT_CONTRACTS_IP_MAX", "3"))
    WINDOW_IP = int(os.getenv("RATELIMIT_CONTRACTS_IP_WINDOW", "60"))

    is_limited, retry = RateLimiter.is_rate_limited(f"contracts_ip:{ip}", LIMIT_IP, WINDOW_IP)
    if is_limited:
        print(f"[SECURITY] contracts rate limit hit: ip={ip}", file=sys.stderr)
        return True, "Muitas consultas realizadas. Por segurança, aguarde antes de tentar novamente.", retry

    return False, "", 0
