## Operations: Setup, Local Run, Deployment

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Environment Variables (backend)

- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST
- CELERY_BROKER_URL, CELERY_RESULT_BACKEND, REDIS_HOST
- S3_ACCESS_KEY, S3_SECRET_KEY, AWS buckets
- AZURE_STORAGE_CONNECTION_STRING, SMTP creds
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- DOMAIN, NEXT_APP_DOMAIN_LINK, CANDIDATE_POOL_BUCKET, APOLLOIO_API_KEY

See `src/api/startdate/settings.py` for full list.

### Local Backend

1. Create venv and install requirements
2. Configure `.env` with required keys
3. Apply migrations and run server

```bash
cd src/api
python -m venv .venv && . .venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Celery

Run a worker with beat using Django scheduler:

```bash
cd src/api
celery -A startdate worker -l info -B --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Local Frontend

```bash
cd src/ui
npm install
npm run dev
# open http://localhost:3000
```

### Deploy (Frontend via PM2)

```bash
cd src/ui
npm ci
npm run deploy:staging
# or
npm run deploy:prod
```

### Observability & Logs

- Django logs: configure via `LOGGING` settings (add handlers as needed)
- Celery logs: worker stdout; consider using process manager/supervisor
- Next.js logs: PM2 logs per ecosystem config


