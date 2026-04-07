import time
from collections import defaultdict
from typing import Dict, List, Tuple
import os

# Estrutura simples em memória para Rate Limiting (sem necessidade de Redis para escala inicial)
# Formato: { key: [timestamp1, timestamp2, ...] }
_request_history: Dict[str, List[float]] = defaultdict(list)

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
            # Calcula quanto tempo falta para a requisição mais antiga expirar
            earliest_request = _request_history[key][0]
            retry_after = int(window_seconds - (now - earliest_request))
            return True, max(1, retry_after)
        
        # Adiciona o novo timestamp
        _request_history[key].append(now)
        return False, 0

def check_rate_limit(ip: str, browser_user_id: str) -> Tuple[bool, str, int]:
    """
    Executa a verificação de segurança combinada (IP + User ID).
    Configurações vindas de variáveis de ambiente.
    """
    # Configurações padrão (pode ser sobrescrito via .env)
    LIMIT_USER = int(os.getenv("RATELIMIT_USER_MAX", "5"))        # 5 mensagens
    WINDOW_USER = int(os.getenv("RATELIMIT_USER_WINDOW", "60"))    # por 60 segundos
    
    LIMIT_IP = int(os.getenv("RATELIMIT_IP_MAX", "15"))           # 15 mensagens
    WINDOW_IP = int(os.getenv("RATELIMIT_IP_WINDOW", "60"))       # por 60 segundos por IP

    # 1. Verifica Limite por User ID (Identificador do Browser)
    is_limited, retry = RateLimiter.is_rate_limited(f"user:{browser_user_id}", LIMIT_USER, WINDOW_USER)
    if is_limited:
        return True, "Limite de mensagens excedido para sua sessão.", retry

    # 2. Verifica Limite por IP (Prevenção contra bots/ataques distribuídos)
    is_limited, retry = RateLimiter.is_rate_limited(f"ip:{ip}", LIMIT_IP, WINDOW_IP)
    if is_limited:
        return True, "Muitas requisições vindas deste endereço de IP.", retry

    return False, "", 0
