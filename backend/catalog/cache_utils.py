import hashlib
from urllib.parse import urlencode

from django.core.cache import cache


def cache_key_from_query(prefix: str, request, extra: str = "") -> str:
    items = []
    for k, vs in request.query_params.lists():
        for v in vs:
            items.append((k, v))
    items.sort()
    raw = urlencode(items)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]
    if extra:
        return f"{prefix}:{extra}:{digest}"
    return f"{prefix}:{digest}"


def cache_get(key: str):
    return cache.get(key)


def cache_set(key: str, value, ttl: int):
    cache.set(key, value, ttl)
