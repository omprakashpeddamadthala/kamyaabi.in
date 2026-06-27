# Continuous Deployment (CD)

This document describes the automated deployment pipeline that ships
`omprakashpeddamadthala/kamyaabi.in` to the production VPS after every merge to
`master`.

## Overview

CI and CD live in a single workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

```
Developer
   │  open PR  ────────────────►  CI runs (build + test, no deploy)
   ▼
PR approved & merged into master
   │
   ▼
push event on master triggers the workflow
   │
   ├─ backend-test           (mvn clean verify — unit/integration tests + coverage)
   ├─ frontend-build         (npm ci + npm run build — typecheck + Vite build)
   │
   ├─ docker-build-push-backend   (needs backend-test → push image to Docker Hub)
   ├─ docker-build-push-frontend  (needs frontend-build → push image to Docker Hub)
   │
   ▼
deploy  (needs both docker push jobs; push-to-master only)
   │
   ▼
ssh <SSH_USERNAME>@<SSH_HOST>
   │
   ▼
cd <DEPLOY_DIR=kamyaabi.in>
   │
   ▼
./deploy.sh   (docker pull latest images → docker compose up -d → health/Nginx check)
   │
   ▼
Deployment complete ✅  (job fails if any step exits non-zero or times out)
```

## Why this design

`deploy.sh` does **not** build anything on the VPS — it pulls the prebuilt
images (`omprakashornold/kamyaabi-backend:latest` and
`omprakashornold/kamyaabi-frontend:latest`) and restarts the compose stack
defined in `docker-compose.prod.yml`. CI already builds, tests, and pushes those
`latest` images on every push to `master`. The `deploy` job therefore only needs
to SSH in and invoke `deploy.sh` **after** the push jobs finish, so the VPS
always pulls the images that just passed CI.

- **PR builds never deploy.** The image push steps are gated with
  `push: ${{ github.event_name != 'pull_request' }}`, and the `deploy` job is
  gated with `if: github.event_name == 'push' && github.ref == 'refs/heads/master'`.
  PRs run build + test only.
- **Deploys are serialized.** A `concurrency` group (`production-deploy`,
  `cancel-in-progress: false`) ensures two rapid merges can't run `deploy.sh`
  on the VM simultaneously.
- **Idempotent & safe to re-run.** `deploy.sh` always pulls + recreates
  containers and prunes dangling images, so re-running it converges to the same
  state.
- **Fails loudly.** `script_stop: true` plus `set -euo pipefail` make any
  failing remote command fail the job; `command_timeout`/`timeout` bound how
  long it can hang. Full remote stdout/stderr is streamed into the Actions log.

## Required GitHub Actions Secrets

Set these under **Settings → Secrets and variables → Actions**.

| Secret | Required | Purpose |
|---|---|---|
| `SSH_HOST` | yes | VPS IP or hostname. |
| `SSH_USERNAME` | yes | SSH login user (e.g. a deploy user; `root` works but a non-root deploy user is preferred). |
| `SSH_PRIVATE_KEY` | preferred | Private key for key-based auth. Use **this** instead of a password. |
| `SSH_PASSWORD` | fallback | Password auth. Used only if `SSH_PRIVATE_KEY` is not set. |
| `SSH_PORT` | optional | SSH port. Defaults to `22`. |
| `DEPLOY_DIR` | optional | Project dir on the VPS. Defaults to `kamyaabi.in`. |

Already required by the existing CI (image build/push):

| Secret | Purpose |
|---|---|
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | Push images to Docker Hub. |
| `VITE_GOOGLE_CLIENT_ID` | Frontend build-arg. |

### Recommended: SSH key auth (instead of password)

On your machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f kamyaabi_deploy_key
# Copy the PUBLIC key to the VPS for the deploy user:
ssh-copy-id -i kamyaabi_deploy_key.pub <SSH_USERNAME>@<SSH_HOST>
# Then store the PRIVATE key (full file contents, including BEGIN/END lines)
# as the GitHub secret SSH_PRIVATE_KEY, and delete the local copies.
```

Then leave `SSH_PASSWORD` unset.

> **Security note:** any password shared in plaintext (chat, commits, logs)
> must be treated as compromised — rotate it immediately and store the new
> credential only as an encrypted GitHub secret, or switch to key auth.

## VPS prerequisites (one-time)

The VPS must already be provisioned (see `setup-vm-ssl.sh`) with:

- The repo cloned at `~/<DEPLOY_DIR>` (default `~/kamyaabi.in`) for `SSH_USERNAME`.
- A populated `.env` next to `docker-compose.prod.yml` (see `.env.example`).
- Docker + Docker Compose plugin installed and the login user able to run `docker`.
- Host Nginx + SSL configured (`setup-vm-ssl.sh`).

## Assumptions

- `master` is the production branch (confirmed in README / branch strategy).
- `deploy.sh` lives in the repo root on the VPS and deploys the `latest` tag.
- The Docker Hub `latest` tag is the deploy target (matches `deploy.sh` default).

## Suggested future improvements

- Deploy an immutable tag (`github.sha`) instead of `latest` for traceable,
  rollback-friendly releases: pass the SHA to `deploy.sh <tag>`.
- Add a post-deploy smoke test (`curl -fsS https://kamyaabi.in/actuator/health`)
  and auto-rollback to the previous tag on failure.
- Use a GitHub **Environment** (`production`) with required reviewers for a
  manual approval gate before deploy.
- Pin third-party actions to commit SHAs for stronger supply-chain guarantees.
