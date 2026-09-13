# Deploying College-Events-hub to Render

**Stack:** Render (Docker web service + static site) · MongoDB Atlas · Brevo email API · GitHub Actions · GitHub Container Registry.
**Cost:** ₹0. No credit card is needed for any of these services.

```
git push main
  └─ CI workflow ─ server checks + API smoke test · client build · docker build
        └─ (success) Deploy workflow
              ├─ push images → ghcr.io (tagged latest + commit SHA)
              ├─ call Render deploy hooks with ref=<commit SHA>
              ├─ wait until /api/health reports that SHA with db connected
              └─ smoke-test the live frontend and API
```

The infrastructure is defined in [`render.yaml`](../render.yaml) (Render Blueprint = Infrastructure as Code).

---

## 1. Create accounts

| Service | Sign up | Used for |
|---|---|---|
| GitHub | https://github.com | Code, CI/CD, container registry |
| Render | https://render.com → **Sign in with GitHub** | Hosting |
| MongoDB Atlas | https://cloud.mongodb.com | Database |
| Brevo | https://www.brevo.com | OTP emails (Render's free tier blocks SMTP, so Gmail won't work there) |

## 2. MongoDB Atlas

1. **Create cluster → M0 Free**. Provider AWS, region **Singapore (ap-southeast-1)**, the same region as Render.
2. **Database Access → Add user** `cehadmin`, with an auto-generated password. Copy it.
3. **Network Access → Add IP → Allow access from anywhere (`0.0.0.0/0`)**. This is required, because Render's free services have no fixed outbound IP.
4. **Connect → Drivers** → copy the URI and add the database name before `?`:
   ```
   mongodb+srv://cehadmin:<password>@<cluster>.mongodb.net/college_events_hub?retryWrites=true&w=majority
   ```

## 3. Brevo (email API)

1. Sign up (free plan: 300 emails/day).
2. Top-right menu → **Senders, Domains & Dedicated IPs → Senders → Add sender**. Use your Gmail address and verify it with the code Brevo emails you. This address becomes `MAIL_FROM`.
3. Top-right menu → **SMTP & API → API keys → Generate a new API key**. Copy it; this is `BREVO_API_KEY`.

> On a brand-new account Brevo may ask you to finish your profile before transactional emails are allowed. Complete it if the logs show `401`/`403` from Brevo.

## 4. Push the code to GitHub

Create your repository and push `main`. In the **Actions** tab:
- **CI** should pass.
- **Deploy to Render** runs **Publish images to GHCR** successfully, then **fails at "Check configuration"**. That is expected until steps 5–7 are done.

## 5. Create the services on Render

Two ways to do this, with the same result. **Option A needs no credit card.** Render sometimes asks for card verification before a Blueprint can be used. Either way, `render.yaml` stays in the repo as the Infrastructure-as-Code definition of these settings.

### Option A – Dashboard (no card)

**5.1 API → New → Web Service**

| Field | Value |
|---|---|
| Source | Git Provider → GitHub → your repository (grant Render access to the repo if asked) |
| Name | `college-events-hub-api2` |
| Language | **Docker** |
| Branch | `main` |
| Region | **Singapore** |
| Root Directory | *(leave empty)* |
| Instance Type | **Free** |
| Environment Variables | `PORT` = `5000` · `MONGO_URI` = Atlas URI · `JWT_SECRET` = click **Generate** · `CLIENT_URL` = `https://college-events-hub.onrender.com` · `BREVO_API_KEY` · `MAIL_FROM` |
| Advanced → Dockerfile Path | `./server/Dockerfile` |
| Advanced → Docker Build Context Directory | `./server` |
| Advanced → Health Check Path | `/api/health` |
| Advanced → Auto-Deploy | **Off** (GitHub Actions triggers deploys) |

Click **Deploy Web Service** and wait for **Live**. Copy the URL shown under the service name.

**5.2 Frontend → New → Static Site**

| Field | Value |
|---|---|
| Repository / Branch | same repo · `main` |
| Name | `college-events-hub` |
| Root Directory | *(leave empty)* |
| Build Command | `cd client && npm ci && npm run build` |
| Publish Directory | `client/dist` |
| Environment Variables | `NODE_VERSION` = `20` · `VITE_API_URL` = `<API URL from 5.1>/api` |
| Advanced → Auto-Deploy | **Off** |

Click **Deploy Static Site**. Then:
- **Redirects/Rewrites** tab → Source `/*`, Destination `/index.html`, Action **Rewrite** → Save. This is needed so refreshing `/admin` works.
- *(Optional)* **Headers** tab → path `/assets/*`, name `Cache-Control`, value `public, max-age=31536000, immutable`.

### Option B – Blueprint (if Render doesn't ask for a card)

1. Render Dashboard → **New → Blueprint** → select your repository. Render reads `render.yaml`.
2. Enter `MONGO_URI`, `BREVO_API_KEY`, `MAIL_FROM` → **Deploy Blueprint**.
3. Render creates both services with all settings from 5.1 and 5.2.

### Check the URLs

Open each service and note its URL:
- API: `https://college-events-hub-api2.onrender.com`
- Frontend: `https://college-events-hub.onrender.com`

If a name was already taken, Render adds a suffix, e.g. `college-events-hub-x7k2.onrender.com`. In that case:
1. API service → **Environment** → set `CLIENT_URL` to the real frontend URL.
2. Static site → **Environment** → set `VITE_API_URL` to `<real API URL>/api`.
3. Update the same two values in `render.yaml` so the code matches, and push.

Test in a browser: `https://<api-url>/api/health` should return `{"status":"ok","db":"connected",...}`.

## 6. Copy the deploy hooks

For **each** service: **Settings → Deploy Hook → copy the URL** (it looks like `https://api.render.com/deploy/srv-xxxx?key=yyyy`).

Keep these URLs secret, since anyone with one can trigger a deploy.

## 7. Configure GitHub

Repository → **Settings → Secrets and variables → Actions**

**Secrets** tab → *New repository secret*:

| Name | Value |
|---|---|
| `RENDER_API_DEPLOY_HOOK` | deploy hook of `college-events-hub-api2` |
| `RENDER_WEB_DEPLOY_HOOK` | deploy hook of `college-events-hub` |
| `MONGO_URI` | Atlas URI (used by the seed workflow) |
| `SEED_ADMIN_PASSWORD` | strong password for the production admin account |

**Variables** tab → *New repository variable*:

| Name | Value |
|---|---|
| `API_URL` | `https://college-events-hub-api2.onrender.com` (no trailing slash, no `/api`) |
| `WEB_URL` | `https://college-events-hub.onrender.com` |

## 8. Seed demo data

**Actions → Seed production database → Run workflow** → type `SEED` → Run.

Demo logins: `student@college.edu` / `password123`. The admin account `admin@college.edu` uses the `SEED_ADMIN_PASSWORD` secret (add it under Secrets before seeding).

## 9. Run the pipeline end to end

Either re-run the failed **Deploy to Render** run, or make a small visible change (e.g. the hero heading in `client/src/pages/Home.jsx`) and push.

Watch **Actions → Deploy to Render**:
1. *Publish images to GHCR*: the images appear under your GitHub profile → **Packages**.
2. *Trigger API/frontend deploy*: in Render, each service's **Events** tab shows a deploy for that commit.
3. *Wait until the API runs the new version*: polls `/api/health` until `version` equals the commit SHA.
4. *Smoke test production*.
5. The run summary shows the live URLs and image tags.

Open the frontend URL. Your change is live.

## 10. Useful Render features for the demo

| Where | What to show |
|---|---|
| Service → **Logs** | Live API logs (requests, `Mail sent via brevo`, errors) |
| Service → **Events** | Deploy history per commit, triggered by the deploy hook |
| Service → **Metrics** | CPU, memory, HTTP requests |
| Service → **Environment** | Secrets managed outside the code |
| Service → **Settings → Health Check Path** | `/api/health` gates every deploy |
| Blueprint page | All infrastructure synced from `render.yaml` |
| Any past deploy → **Rollback** | One-click rollback to a previous version |

## 11. Run the production images locally (optional)

```bash
GHCR_OWNER=<your-github-username-lowercase> IMAGE_TAG=latest \
docker compose -f docker-compose.prod.yml up -d      # → http://localhost:8080
```

GHCR packages are private by default. Run `docker login ghcr.io` first, or set the packages to public under **Package settings**.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Deploy workflow fails at **Check configuration** | Secrets or variables from step 7 are missing or misspelled |
| Deploy hook returns `404` | Render hasn't fetched that commit yet, or the hook URL is wrong. Re-run the job |
| "did not report version … within 15 minutes" | Open Render → API service → **Logs**. Usually `MONGO_URI` is wrong or Atlas Network Access doesn't allow `0.0.0.0/0` |
| Frontend loads but shows *Network Error* | `VITE_API_URL` on the static site or `CLIENT_URL` on the API doesn't match the real URLs (step 5). Redeploy the static site after changing `VITE_API_URL`, because it's baked in at build time |
| First page load takes ~50 s | The free instance was asleep after 15 minutes idle. Open `/api/health` once before a demo to wake it |
| No OTP email | Check the API logs for `Mail delivery via brevo failed`. Verify the sender in Brevo and check the API key. Also look in the Spam folder |
| Refreshing `/admin` gives 404 | The static site's rewrite rule `/* → /index.html` is missing. Re-sync the Blueprint |
