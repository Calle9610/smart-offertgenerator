# Rate Limiting

## Översikt

Backend API:et har implementerat rate limiting för att förhindra missbruk och skydda mot DDoS-attacker. Rate limiting är konfigurerat till **10 requests per minut per IP-adress**.

## Teknisk implementation

### Dependencies
- **slowapi**: Används för rate limiting funktionalitet
- **IP-baserad identifiering**: Varje IP-adress har sin egen räknare

### Konfiguration
```python
# 10 requests per minut per IP
limiter = Limiter(key_func=get_remote_address)
limiter.limit("10/minute")
```

### Middleware
Rate limiting middleware läggs till automatiskt i `main.py`:
```python
from .rate_limiting import apply_rate_limits
# ...
apply_rate_limits(app)
```

## Beteende

### Normal användning
- Första 10 requests per minut: **200 OK**
- Alla efterföljande requests: **429 Too Many Requests**

### Rate limit överskriden
När rate limit överskrids returneras:
```json
{
  "error": "Rate limit exceeded",
  "message": "Du har överskridit gränsen på 10 förfrågningar per minut. Försök igen senare.",
  "retry_after": 60,
  "limit": 60,
  "detail": "Rate limit exceeded. Try again later."
}
```

### Headers
Rate limit information finns i response headers:
- `X-RateLimit-Limit`: Max requests per period
- `X-RateLimit-Remaining`: Återstående requests
- `X-RateLimit-Reset`: Tid till reset (sekunder)

## Testning

### Kör tester
```bash
cd backend
pytest tests/test_rate_limiting.py -v
```

### Manuell testning
```bash
# Gör 10 requests
for i in {1..10}; do curl http://localhost:8000/health; done

# 11:e request bör ge 429
curl http://localhost:8000/health
```

## Produktionsöverväganden

### Skalbarhet
- **Utveckling**: In-memory storage (begränsat till en server)
- **Produktion**: Redis eller liknande för distribuerad rate limiting

### Konfiguration
Rate limits kan enkelt justeras i `app/rate_limiting.py`:
```python
# Ändra från 10/minute till t.ex. 100/minute
limiter.limit("100/minute")(app)
```

### Monitoring
- Logga rate limit events för analys
- Övervaka IP-adresser som överskrider limits
- Varningar för ovanligt höga request-rates

## Säkerhet

### IP-spoofing skydd
- Använd `X-Forwarded-For` headers för bakom proxy
- Validera IP-adresser
- Rate limiting per användare (JWT) som alternativ

### Whitelist
Kritiska endpoints kan exkluderas från rate limiting:
```python
@app.get("/health")
@limiter.exempt
def health_check():
    return {"status": "healthy"}
```

## Troubleshooting

### Vanliga problem
1. **Rate limit triggas för tidigt**: Kontrollera IP-identifiering
2. **Ingen rate limiting**: Verifiera middleware-ordning
3. **429 på alla requests**: Kontrollera rate limit konfiguration

### Debug
Aktivera debug logging:
```python
import logging
logging.getLogger('slowapi').setLevel(logging.DEBUG)
```
