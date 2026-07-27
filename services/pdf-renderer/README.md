# CV UP — PDF renderer

Prints résumés to PDF with a real browser. This is the only part of CV UP that
is not the Next.js app (ADR 0001), because correct page breaks and embedded
fonts need a browser (ADR 0002).

## How it works

It **pulls** work; nothing pushes to it (ADR 0008).

```
loop:
  POST /api/render/claim      -> 204 (idle)  |  { exportId, renderUrl }
  open renderUrl, print to PDF
  POST /api/render/complete   -> the PDF bytes, or an x-export-error header
```

Consequences worth knowing:

- It needs **no inbound URL**, so it can run anywhere with outbound HTTPS —
  including a laptop, pointed at production, which is how to test it before
  setting up Railway.
- It holds **no database credentials and no storage token**. Its entire
  authority is one shared secret.
- A renderer killed mid-job loses nothing: the app reclaims a job that stops
  reporting in and retries it, up to three attempts.

## Configuration

| Variable               | Required | Meaning                                        |
| ---------------------- | -------- | ---------------------------------------------- |
| `APP_URL`              | yes      | Base URL of the app, no trailing slash         |
| `RENDER_WORKER_SECRET` | yes      | Must equal the app's variable of the same name |
| `IDLE_POLL_MS`         | no       | Poll interval when the queue is empty (5000)   |
| `ERROR_BACKOFF_MS`     | no       | Wait after a failed poll (15000)               |
| `RENDER_TIMEOUT_MS`    | no       | Give up on one render after this (45000)       |
| `PORT`                 | no       | Health check port (8080)                       |

Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set the **same value** in the app (Vercel) and here. Until it is set in the
app, PDF export stays hidden — there is no half-working export button.

## Running it locally

```bash
cd services/pdf-renderer
npm install
npx playwright install --with-deps chromium

APP_URL=http://localhost:3000 RENDER_WORKER_SECRET=<same as the app> npm start
```

Then open a résumé in the editor and press **Gerar PDF**.

## Deploying to Railway

1. New service → deploy from this repo, root directory `services/pdf-renderer`.
2. Railway detects the `Dockerfile`; no build command needed.
3. Set `APP_URL` and `RENDER_WORKER_SECRET`.
4. No public domain is required — nothing calls in. The health check on `PORT`
   exists only so Railway can tell the service is alive.

Scaling is by replicas: claims are atomic, so two renderers never take the same
job.
