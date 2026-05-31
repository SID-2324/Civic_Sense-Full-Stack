# SafeSwitch Backend

This backend powers the SafeSwitch emergency privacy lockdown demo.

## What it covers

- Email-based auth through Supabase, with a local demo fallback for hackathon mode
- Emergency mode activation
- Exposure and threat scoring
- Safety action plan generation
- Evidence upload with encryption before storage
- Admin access request workflow
- Audit log capture for every key action

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies.
3. Run `npm run dev`.

## API flow

- `POST /api/emergency/activate`
- `POST /api/assessments/exposure`
- `POST /api/assessments/threat`
- `POST /api/assessments/checklist`
- `POST /api/evidence`
- `POST /api/admin/requests`
- `PATCH /api/admin/requests/:id`
- `GET /api/audit`

## Keep in mind

- Use the demo auth fallback only for local/hackathon demos.
- Keep the Admin Portal simulated unless you have a real policy and access workflow.
- Encrypt evidence before storage and log every access request.
- Avoid building real integrations for social platforms or government systems.

## Testing & Connecting the Frontend (Quickstart)

This section shows how a new developer can run the backend locally, exercise the main flows, and connect a frontend during development.

1) Prepare environment

- Copy the example env and set at minimum `APP_ENCRYPTION_SECRET`. If you want persistent storage, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

```powershell
Copy-Item .env.example .env
notepad .env
```

2) Install and run

```bash
npm install
npm run dev
```

The server defaults to `http://localhost:3001`. Health check:

```bash
curl http://localhost:3001/health
```

3) Demo auth for frontend development

For hackathon/demo mode we support a simple header-based demo identity so you can connect the frontend without Supabase:

- `x-demo-user-id` — user id (string)
- `x-demo-user-email` — email
- `x-demo-user-name` — display name
- `x-demo-role` — `user` or `admin`

When your frontend makes fetch requests during development, add these headers. Example using Fetch API:

```js
fetch('http://localhost:3001/api/assessments/exposure', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-demo-user-id': 'alice',
		'x-demo-user-email': 'alice@example.com',
		'x-demo-user-name': 'Alice',
		'x-demo-role': 'user'
	},
	body: JSON.stringify({ publicInstagram: true })
});
```

4) Example curl flows (quick copy/paste)

- Run exposure assessment:

```bash
curl -X POST http://localhost:3001/api/assessments/exposure \
	-H "Content-Type: application/json" \
	-H "x-demo-user-id: alice" \
	-d '{"publicInstagram":true,"locationSharing":false}'
```

- Activate emergency mode:

```bash
curl -X POST http://localhost:3001/api/emergency/activate \
	-H "Content-Type: application/json" \
	-H "x-demo-user-id: alice" \
	-d '{"reason":"Threat received","exposureAnswers":{"publicInstagram":true},"threatAnswers":{"directThreats":true}}'
```

- Upload evidence (multipart) — replace `/path/to/file.png`:

```bash
curl -X POST http://localhost:3001/api/evidence \
	-H "x-demo-user-id: alice" \
	-F "file=@/path/to/file.png" \
	-F "label=Threat screenshot"
```

5) Frontend integration notes

- Set your frontend's API base URL to `http://localhost:3001/api` (or the deployed URL).
- Ensure the frontend sends the demo headers during development, or use Supabase auth in production by wiring `SUPABASE_URL` and the appropriate client keys.
- The backend CORS origin is controlled by `CORS_ORIGIN` in `.env`.

6) Scripts for quick testing

- `scripts/test.sh` contains a sequence of curl commands you can run on macOS/Linux (or WSL).
- `scripts/test.ps1` contains PowerShell-ready commands for Windows.

7) Security notes

- The project encrypts file contents using Node's `crypto` (AES-256-GCM) before upload. Metadata (labels, case IDs, audit logs) are stored in plaintext in the DB for demo purposes.
- Do not use the demo auth in production — enable Supabase auth and remove `ALLOW_DEMO_AUTH` or set it to `false`.

If you'd like, I can add an OpenAPI spec or Postman collection next to help frontend developers import the API definitions.
