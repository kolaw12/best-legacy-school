# Production hardening — Best Legacy Divine School

A pre-launch checklist + the wiring that's already in place.

## Already shipped

- `GET /api/healthz/` — cheap probe (no DB hit). Point UptimeRobot at it.
- `backend/scripts/backup_db.py` — nightly `pg_dump` (or sqlite copy) → `backend/backups/`. 30-day retention. Add to cron / Render Job.
- `frontend/src/config/sentry.js` — lazy-loaded Sentry init. Activates when `VITE_SENTRY_DSN` is set. No-op otherwise.
- `ErrorBoundary` wraps the whole tree in `main.jsx` — render crashes show a friendly fallback, never a blank page.
- DRF `TokenAuthentication` enabled with `IsAdminOrReadOnly` / `IsTeacherOrAdmin` on write endpoints.
- `AuditLog` table + signals captures every write to Student/Teacher/Guardian/Grade/Assessment/Attendance/Invoice/Payment/FeeSchedule.
- HTTPS-aware `CSRF_TRUSTED_ORIGINS` + `CORS_ALLOW_ALL_ORIGINS` (tighten in prod, see below).
- `whitenoise` + `CompressedManifestStaticFilesStorage` for static assets.
- Cloudinary for media in prod (when `DEBUG=False`).

## Pre-launch checklist

### 1. Secrets — REQUIRED

The current repo has development defaults in `backend/school_project/settings.py`:

- `DJANGO_SECRET_KEY` → **rotate** before launch.
- `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` → currently `towshk3@gmail.com` + an app password. **Rotate the app password and move both to environment variables.** Better: switch to Mailgun / Postmark for SPF/DKIM/DMARC alignment so admission confirmations don't go to spam.
- `CLOUDINARY_*` → set on the host.
- `SENTRY_DSN` → set both backend (when added) and frontend (`VITE_SENTRY_DSN`).
- `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` → see Paystack section below.
- (Optional) `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` → see WhatsApp section.

### 2. `DEBUG=False` audit

In `settings.py`:

- `DEBUG = os.environ.get('DEBUG', 'True') == 'True'` — set `DEBUG=False` in prod.
- `ALLOWED_HOSTS` — set to the actual production hostnames.
- `CORS_ALLOW_ALL_ORIGINS = True` is for dev. In prod, replace with:
  ```py
  CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
  ```
- Add cookie + HTTPS hardening when `DEBUG=False`:
  ```py
  if not DEBUG:
      SECURE_SSL_REDIRECT = True
      SESSION_COOKIE_SECURE = True
      CSRF_COOKIE_SECURE = True
      SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # 30 days
      SECURE_HSTS_INCLUDE_SUBDOMAINS = True
      SECURE_HSTS_PRELOAD = True
      SECURE_REFERRER_POLICY = 'same-origin'
      SECURE_CONTENT_TYPE_NOSNIFF = True
      X_FRAME_OPTIONS = 'DENY'
  ```

### 3. Database backups

Set up the nightly backup as a cron job / Render scheduled job:

```cron
0 2 * * *  cd /app/backend && /app/backend/venv/bin/python scripts/backup_db.py
```

For real safety, copy backups off-host (S3 / Backblaze) — local disk fails together with the DB.

### 4. Monitoring

- Healthcheck: `GET https://<your-domain>/api/healthz/` should return `200 {"status":"ok"}`. Point UptimeRobot at it on a 5-min interval.
- Sentry frontend: set `VITE_SENTRY_DSN` and rebuild. After that, any uncaught render error or rejected promise auto-reports.
- Backend Sentry: when ready, `pip install sentry-sdk` and add to `settings.py`:
  ```py
  import sentry_sdk
  sentry_sdk.init(dsn=os.environ.get('SENTRY_DSN'), traces_sample_rate=0.1, send_default_pii=False)
  ```

### 5. Paystack (required for online fee payment)

Adapter is scaffolded; activates when keys are set.

1. Sign up at https://dashboard.paystack.com/ → get **test** keys first.
2. Set env vars:
   ```
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_WEBHOOK_SECRET=whsec_...   # optional, recommended
   ```
3. Frontend: set `VITE_PAYSTACK_PUBLIC_KEY=pk_test_...` (Vite will inline at build).
4. Configure the webhook URL in Paystack dashboard:
   `https://<your-domain>/api/finance/paystack/webhook/`
5. Test a NGN 100 transaction. Once green, swap test keys for live keys.

### 6. WhatsApp Cloud API (optional — broadcast announcements)

Without keys, the system gracefully falls back to `wa.me` deep-links (we ship those today).

1. Set up a Meta Business + WhatsApp Business app at https://developers.facebook.com.
2. Verify the school phone number.
3. Set:
   ```
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_ID=...
   ```
4. The system can then broadcast to opted-in parents directly. Until then, the same announcement renders as a "Forward to WhatsApp" link parents tap themselves.

### 7. Static + media

- Static: whitenoise serves it from `staticfiles/`. `python manage.py collectstatic --noinput` runs in `build.sh`.
- Media: Cloudinary in prod. Verify the env vars are set or images will silently 500.

### 8. Pre-launch smoke test

Walk through these as each role:

- [ ] Public site loads, all 7 routes return 200.
- [ ] Admissions form: submits cleanly, success state shows, email arrives, ref ID copies, WhatsApp share opens, confetti fires.
- [ ] Sign in as `admin/admin123` (rotated for prod): dashboard loads, can accept/enrol an admission, can record a payment.
- [ ] Sign in as `teacher/teacher123`: own class shows, can mark attendance, can enter a grade.
- [ ] Sign in as `parent/parent123`: only sees own child, can view report card, can record a payment.
- [ ] Print a report card → looks clean (nav, blobs, motion all hidden).
- [ ] `/api/healthz/` returns 200.
- [ ] Backup script runs and writes a file under `backend/backups/`.
- [ ] Audit log captures the test writes you just did.

### Known limitations to own publicly

- Audit log occasionally misses the actor on no-op `PATCH`es (DRF/middleware ordering). The action + object + diff are still captured. Production fix: replace the in-house audit signal with `django-easy-audit` or `django-crum`.
- Paystack and WhatsApp Business API are scaffolded but require your credentials before they go live. Self-reported transfers + `wa.me` deep-links work today as fallbacks.
- Currency conversion on Admissions is indicative only (rates are hardcoded with a "paid in NGN at school rate" disclaimer in the UI).
