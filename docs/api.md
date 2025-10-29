## API Overview

Top-level routing is defined in `startdate/urls.py` and composes per-app endpoints.

```19:36:src/api/startdate/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('accounts.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/candidates/', include('candidate.urls')),
    path('api/jobs/', include('job_posting.urls')),
    path('api/companies/', include('company.urls')),
    path('api/machine_learning/', include('machine_learning.urls')),
    path('api/adwerks/', include('adwerks.urls')),
    path('api/subscriptions/', include('payment_history.urls')),
    path('api/locations/', include('location.urls')),
    path('api/v1/powered_by/', include('powered_by.urls')),
    path('api/v1/playground/', include('playground.urls')),
    path('api/model_training/', include('model_training.urls')),
    path('api/shareable/candidates/', include('shareable_link.urls')),
    path('api/chats/', include('conversation_thread.urls')),
    path('api/job_titles/', include('title_mapping.urls')),
]
```

### Authentication

- Token-based auth using `knox`. Include `Authorization: Token <token>` header.
- Rate-limits are set via DRF throttling (`anon: 5/day`, `user: 500/day`).

```266:279:src/api/startdate/settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'knox.auth.TokenAuthentication',
     ),
    ...
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/day',
        'user': '500/day'
    }
}
```

### App Routers

For detailed endpoints, see each app’s `urls.py` and `views.py` under `src/api/<app>/`.

- `accounts`: user management, auth, notifications
- `candidate`: CRUD, enrichment, screening
- `company`: companies, locations, industries
- `job_posting`: job postings, candidate processing
- `conversation_thread`: threads and messages
- `payment_history`: subscriptions and webhooks
- `machine_learning`: ranking APIs
- `model_training`: training jobs
- `powered_by`: webhook-based integrations
- `integrations`: third-party keys
- `shareable_link`: shared views of candidates
- `title_mapping`, `filters`, `location`: taxonomies and filters
- `playground`: sandbox endpoints (throttled)

### Versioning

- Some endpoints are nested under `api/v1/` (e.g., `powered_by`, `playground`).

### Error Handling

- Custom 404 middleware is registered.

```134:144:src/api/startdate/settings.py
MIDDLEWARE = [
    ...
    'startdate.middleware.http_404.Custom404MiddleWare',
]
```


