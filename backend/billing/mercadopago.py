import uuid
import requests

MP_API = "https://api.mercadopago.com"


class MercadoPagoError(RuntimeError):
    pass


def mp_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Idempotency-Key": str(uuid.uuid4())[:64],
    }


def create_preapproval(*, access_token: str, payer_email: str, reason: str, back_url: str,
                      currency_id: str, transaction_amount: float, frequency: int, frequency_type: str,
                      external_reference: str = "") -> dict:
    payload = {
        "payer_email": payer_email,
        "reason": reason,
        "back_url": back_url,
        "external_reference": external_reference,
        "auto_recurring": {
            "currency_id": currency_id,
            "transaction_amount": transaction_amount,
            "frequency": frequency,
            "frequency_type": frequency_type,
        },
    }

    r = requests.post(f"{MP_API}/preapproval", headers=mp_headers(access_token), json=payload, timeout=20)
    if r.status_code >= 400:
        raise MercadoPagoError(f"MP create_preapproval failed {r.status_code}: {r.text}")
    return r.json()


def get_preapproval(access_token: str, preapproval_id: str) -> dict:
    r = requests.get(
        f"{MP_API}/preapproval/{preapproval_id}",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20,
    )
    if r.status_code >= 400:
        raise MercadoPagoError(f"MP get_preapproval failed {r.status_code}: {r.text}")
    return r.json()
