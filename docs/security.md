## Security, Auth, Permissions

### Authentication

- Token auth via `knox`. Tokens must be sent as `Authorization: Token <token>`.
- Throttling configured in DRF settings (`anon: 5/day`, `user: 500/day`).

### Authorization

- Role-based fields on `accounts.User` (employer, job_seeker, admin, hiring_manager)
- App-specific permission checks within views/serializers (review per app)

### Data Protection

- Soft-delete (`SoftDeleteObject`) commonly used to avoid hard deletes
- PII in `Candidate` and `User` should be masked in logs and exports
- Credentials and secrets loaded via environment variables

### Transport & CORS

- HTTPS assumed in production
- CORS restricted to configured origins in settings

```51:58:src/api/startdate/settings.py
CORS_ORIGIN_ALLOW_ALL = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001'
]
```

### Email & External Services

- SMTP (Amazon SES) and Azure Email client configured via secrets
- Stripe secrets and webhooks configured in environment

### Recommendations

- Move sensitive literals out of settings; ensure all secrets come from env
- Add `LOGGING` config to redact PII and secrets
- Implement per-endpoint permission classes and tests
- Adopt `django-axes` or similar to rate-limit auth endpoints, if needed


