"""
whatsapp_service.py
═══════════════════════════════════════════════════════════════════════════════
Camada isolada de provedor WhatsApp via Uazapi.

SEGURANÇA:
- Todas as credenciais vêm exclusivamente de variáveis de ambiente (backend-only).
- Nenhuma chamada é feita ao cliente/frontend.
- Token nunca exposto em respostas de API externas.
- Logs sem vazamento de credentials.

CONFIGURAÇÃO (preencher no ambiente de produção):
  WHATSAPP_PROVIDER=uazapi           # Provedor ativo (padrão: uazapi)
  WHATSAPP_ENABLED=false             # Ativar apenas quando credenciais finais estiverem prontas
  UAZAPI_BASE_URL=                   # Ex: https://sua-instancia.uazapi.com
  UAZAPI_INSTANCE_ID=                # ID da instância Uazapi
  UAZAPI_TOKEN=                      # Token de autenticação Uazapi
  UAZAPI_WEBHOOK_SECRET=             # Secret para validação do webhook de entrada
  WHATSAPP_DEFAULT_COUNTRY_CODE=55   # Código do país padrão (Brasil)
  WHATSAPP_COMMERCIAL_NUMBER=        # Número comercial no formato internacional (ex: 5511999999999)

INTERFACE PÚBLICA:
  WhatsAppService.send_text(to, text)
  WhatsAppService.send_image(to, image_url, caption=None)
  WhatsAppService.send_document(to, file_url, filename=None, caption=None)
  WhatsAppService.send_buttons(to, text, buttons)
  WhatsAppService.send_list(to, header, body, footer, sections)
  WhatsAppService.is_enabled()
  WhatsAppService.validate_config()
  WhatsAppService.normalize_phone(raw_phone)
"""

import os
import sys
import hmac
import hashlib
import requests
from typing import Optional, List, Dict, Any


# ── Leitura de configuração (backend-only, jamais exposto ao frontend) ─────────

def _cfg(key: str, default: str = "") -> str:
    """Lê variável de ambiente com fallback seguro."""
    return os.getenv(key, default).strip()


class WhatsAppConfig:
    """Configuração isolada do canal WhatsApp. Lida do ambiente em runtime."""

    @staticmethod
    def provider() -> str:
        return _cfg("WHATSAPP_PROVIDER", "uazapi").lower()

    @staticmethod
    def enabled() -> bool:
        val = _cfg("WHATSAPP_ENABLED", "false").lower()
        return val in ("true", "1", "yes", "on")

    @staticmethod
    def base_url() -> str:
        return _cfg("UAZAPI_BASE_URL", "").rstrip("/")

    @staticmethod
    def instance_id() -> str:
        return _cfg("UAZAPI_INSTANCE_ID", "")

    @staticmethod
    def token() -> str:
        return _cfg("UAZAPI_TOKEN", "")

    @staticmethod
    def webhook_secret() -> str:
        return _cfg("UAZAPI_WEBHOOK_SECRET", "")

    @staticmethod
    def default_country_code() -> str:
        return _cfg("WHATSAPP_DEFAULT_COUNTRY_CODE", "55")

    @staticmethod
    def commercial_number() -> str:
        return _cfg("WHATSAPP_COMMERCIAL_NUMBER", "")

    @classmethod
    def is_fully_configured(cls) -> bool:
        """True apenas quando todas as credenciais críticas estão presentes."""
        return bool(
            cls.base_url()
            and cls.instance_id()
            and cls.token()
        )

    @classmethod
    def validation_errors(cls) -> List[str]:
        """Retorna lista de problemas de configuração sem vazar os valores."""
        errors = []
        if not cls.provider():
            errors.append("WHATSAPP_PROVIDER não definido.")
        if not cls.base_url():
            errors.append("UAZAPI_BASE_URL não definido ou vazio.")
        if not cls.instance_id():
            errors.append("UAZAPI_INSTANCE_ID não definido ou vazio.")
        if not cls.token():
            errors.append("UAZAPI_TOKEN não definido ou vazio.")
        if not cls.webhook_secret():
            errors.append("UAZAPI_WEBHOOK_SECRET não definido — webhook inseguro.")
        return errors


# ── Normalização de telefone ────────────────────────────────────────────────────

def normalize_phone(raw: str, country_code: Optional[str] = None) -> str:
    """
    Normaliza número de telefone para formato Uazapi (apenas dígitos, com DDI).
    Ex: +55 (11) 99999-9999 → 5511999999999
    """
    if not raw:
        return ""
    digits = "".join(ch for ch in raw if ch.isdigit())
    cc = country_code or WhatsAppConfig.default_country_code()
    # Se não começar com o código do país, adiciona
    if not digits.startswith(cc):
        digits = cc + digits
    return digits


# ── Validação de assinatura do webhook ─────────────────────────────────────────

def verify_webhook_signature(payload_bytes: bytes, received_signature: str) -> bool:
    """
    Valida assinatura HMAC-SHA256 do webhook Uazapi.
    Compara em tempo constante para prevenir timing attacks.

    Se UAZAPI_WEBHOOK_SECRET não estiver configurado, retorna False (nega por segurança).
    """
    secret = WhatsAppConfig.webhook_secret()
    if not secret:
        print("[WHATSAPP-SECURITY] UAZAPI_WEBHOOK_SECRET não configurado — webhook rejeitado.", file=sys.stderr)
        return False
    expected = hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    # Remove prefixo "sha256=" se presente
    sig = received_signature.replace("sha256=", "").strip()
    return hmac.compare_digest(expected, sig)


# ── Cliente HTTP interno (nunca chamado pelo frontend) ─────────────────────────

class _UazapiClient:
    """
    Cliente HTTP para Uazapi. Uso exclusivo do backend.
    Constrói URLs dinamicamente a partir das variáveis de ambiente.
    """

    @staticmethod
    def _headers() -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "token": WhatsAppConfig.token(),
        }

    @classmethod
    def _url(cls, path: str) -> str:
        base = WhatsAppConfig.base_url()
        instance = WhatsAppConfig.instance_id()
        # Uazapi URL pattern: {base}/{path} com instance_id no body ou como header
        return f"{base}/{path.lstrip('/')}"

    @classmethod
    def post(cls, path: str, body: dict) -> Dict[str, Any]:
        """
        Executa POST autenticado à Uazapi.
        Loga apenas status e tipo de mensagem — sem dados de conteúdo ou credenciais.
        """
        url = cls._url(path)
        try:
            resp = requests.post(
                url,
                headers=cls._headers(),
                json=body,
                timeout=10
            )
            status = resp.status_code
            if status not in (200, 201):
                # Log sem conteúdo da mensagem para não vazar dados sensíveis
                print(f"[WHATSAPP] POST {path} → HTTP {status} (não-OK)", file=sys.stderr)
                return {"ok": False, "status": status, "error": f"HTTP {status}"}
            return {"ok": True, "status": status, "data": resp.json()}
        except requests.exceptions.ConnectionError:
            print(f"[WHATSAPP] Falha de conexão com Uazapi em {url} — credenciais não preenchidas?", file=sys.stderr)
            return {"ok": False, "error": "connection_error"}
        except requests.exceptions.Timeout:
            print(f"[WHATSAPP] Timeout na chamada a Uazapi: {path}", file=sys.stderr)
            return {"ok": False, "error": "timeout"}
        except Exception as e:
            # Log apenas tipo de exceção — sem credentials ou conteúdo
            print(f"[WHATSAPP] Erro inesperado em POST {path}: {type(e).__name__}", file=sys.stderr)
            return {"ok": False, "error": "unexpected_error"}


# ── Interface pública da camada de provedor ────────────────────────────────────

class WhatsAppService:
    """
    Interface pública isolada do canal WhatsApp.
    Todos os métodos são seguros para uso interno no backend.
    Nenhum método deve ser exposto diretamente ao cliente/frontend.
    """

    @staticmethod
    def is_enabled() -> bool:
        """Verifica se o canal WhatsApp está habilitado E configurado."""
        return WhatsAppConfig.enabled() and WhatsAppConfig.is_fully_configured()

    @staticmethod
    def validate_config() -> Dict[str, Any]:
        """
        Retorna diagnóstico de configuração para uso em health checks internos.
        NÃO retorna valores das credenciais — apenas presença/ausência.
        """
        errors = WhatsAppConfig.validation_errors()
        return {
            "provider": WhatsAppConfig.provider(),
            "enabled": WhatsAppConfig.enabled(),
            "configured": WhatsAppConfig.is_fully_configured(),
            "ready": WhatsAppService.is_enabled(),
            "errors": errors,
            # Indica presença sem expor o valor
            "base_url_set": bool(WhatsAppConfig.base_url()),
            "instance_id_set": bool(WhatsAppConfig.instance_id()),
            "token_set": bool(WhatsAppConfig.token()),
            "webhook_secret_set": bool(WhatsAppConfig.webhook_secret()),
        }

    @staticmethod
    def normalize_phone(raw: str) -> str:
        """Normaliza número de telefone para formato Uazapi."""
        return normalize_phone(raw)

    @staticmethod
    def _guard() -> Optional[Dict[str, Any]]:
        """
        Guard interno: retorna erro estruturado se o canal não estiver pronto.
        Retorna None se está pronto para envio.
        """
        if not WhatsAppConfig.enabled():
            return {"ok": False, "error": "whatsapp_disabled", "message": "Canal WhatsApp desabilitado (WHATSAPP_ENABLED=false)."}
        if not WhatsAppConfig.is_fully_configured():
            errors = WhatsAppConfig.validation_errors()
            return {"ok": False, "error": "whatsapp_not_configured", "message": "Credenciais WhatsApp incompletas.", "details": errors}
        return None

    # ── Envio de texto simples ─────────────────────────────────────────────────

    @classmethod
    def send_text(cls, to: str, text: str) -> Dict[str, Any]:
        """
        Envia mensagem de texto para o número WhatsApp informado.

        Args:
            to:   Número destino (será normalizado automaticamente).
            text: Conteúdo da mensagem (plain text).

        Returns:
            Dict com {"ok": bool, ...}
        """
        guard = cls._guard()
        if guard:
            return guard

        phone = normalize_phone(to)
        if not phone:
            return {"ok": False, "error": "invalid_phone"}

        body = {
            "instanceId": WhatsAppConfig.instance_id(),
            "number": phone,
            "text": text,
        }
        return _UazapiClient.post("/message/sendText", body)

    # ── Envio de imagem ────────────────────────────────────────────────────────

    @classmethod
    def send_image(cls, to: str, image_url: str, caption: Optional[str] = None) -> Dict[str, Any]:
        """
        Envia imagem via URL pública para o número WhatsApp informado.

        Args:
            to:        Número destino.
            image_url: URL pública da imagem.
            caption:   Legenda opcional da imagem.

        Returns:
            Dict com {"ok": bool, ...}
        """
        guard = cls._guard()
        if guard:
            return guard

        phone = normalize_phone(to)
        if not phone:
            return {"ok": False, "error": "invalid_phone"}

        body = {
            "instanceId": WhatsAppConfig.instance_id(),
            "number": phone,
            "imageUrl": image_url,
            "caption": caption or "",
        }
        return _UazapiClient.post("/message/sendImage", body)

    # ── Envio de documento ────────────────────────────────────────────────────

    @classmethod
    def send_document(cls, to: str, file_url: str, filename: Optional[str] = None, caption: Optional[str] = None) -> Dict[str, Any]:
        """
        Envia documento (PDF, DOCX, etc.) via URL pública.

        Args:
            to:       Número destino.
            file_url: URL pública do arquivo.
            filename: Nome do arquivo exibido no WhatsApp.
            caption:  Legenda opcional.

        Returns:
            Dict com {"ok": bool, ...}
        """
        guard = cls._guard()
        if guard:
            return guard

        phone = normalize_phone(to)
        if not phone:
            return {"ok": False, "error": "invalid_phone"}

        body = {
            "instanceId": WhatsAppConfig.instance_id(),
            "number": phone,
            "documentUrl": file_url,
            "fileName": filename or "documento",
            "caption": caption or "",
        }
        return _UazapiClient.post("/message/sendDocument", body)

    # ── Envio de botões de resposta rápida ────────────────────────────────────

    @classmethod
    def send_buttons(cls, to: str, text: str, buttons: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Envia mensagem com botões de resposta rápida.

        Args:
            to:      Número destino.
            text:    Texto principal da mensagem.
            buttons: Lista de botões. Formato: [{"id": "btn1", "text": "Sim"}, ...]
                     Máximo 3 botões (limitação WhatsApp).

        Returns:
            Dict com {"ok": bool, ...}

        Nota: Suporte real depende do plano/instância Uazapi. A estrutura está
              preparada para quando o provedor suportar.
        """
        guard = cls._guard()
        if guard:
            return guard

        phone = normalize_phone(to)
        if not phone:
            return {"ok": False, "error": "invalid_phone"}

        # Normaliza formato de botões para Uazapi
        formatted_buttons = [
            {"buttonId": btn.get("id", f"btn{i}"), "buttonText": {"displayText": btn.get("text", "")}}
            for i, btn in enumerate(buttons[:3])  # máx 3 botões
        ]

        body = {
            "instanceId": WhatsAppConfig.instance_id(),
            "number": phone,
            "text": text,
            "footer": "",
            "buttons": formatted_buttons,
        }
        return _UazapiClient.post("/message/sendButtons", body)

    # ── Envio de lista/menu ───────────────────────────────────────────────────

    @classmethod
    def send_list(
        cls,
        to: str,
        header: str,
        body: str,
        footer: str,
        sections: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Envia mensagem com lista/menu interativo (list message).

        Args:
            to:       Número destino.
            header:   Cabeçalho da lista.
            body:     Corpo principal da mensagem.
            footer:   Rodapé da mensagem.
            sections: Lista de seções. Formato:
                      [{"title": "Seção", "rows": [{"rowId": "id", "title": "Item", "description": "Desc"}]}]

        Returns:
            Dict com {"ok": bool, ...}
        """
        guard = cls._guard()
        if guard:
            return guard

        phone = normalize_phone(to)
        if not phone:
            return {"ok": False, "error": "invalid_phone"}

        payload = {
            "instanceId": WhatsAppConfig.instance_id(),
            "number": phone,
            "text": body,
            "title": header,
            "footer": footer,
            "buttonText": "Ver opções",
            "sections": sections,
        }
        return _UazapiClient.post("/message/sendList", payload)
