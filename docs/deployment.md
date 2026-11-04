# Docker and Dokploy preparation

Phase 1 adds packaging only. PostgreSQL, Prisma, migrations and business modules are not installed or executed. No database is required to build or start the current application.

## Image design

The Dockerfile uses Node 24 on Debian Bookworm slim, pnpm 12.16.1 (matching package.json), a frozen lockfile and a BuildKit package-store cache. Build dependencies stay in intermediate stages. The final image contains the traced Next.js standalone server, static files and public assets, runs as the unprivileged `node` user, and starts directly with `node server.js`. It needs neither pnpm nor dependency installation at startup. Debian, OpenSSL and CA certificates provide a foundation for later Prisma and TLS support; Prisma generation and engine compatibility must be verified when Prisma is added.

The runtime binds to `0.0.0.0:3000`. Its health check requests `/` and requires HTTP 200. Update this check if the home route later requires authentication or redirects. Docker records health status; unhealthy status alone does not restart a container. Configure monitoring and restart/replacement policy in the hosting environment.

Base tags track security updates. Rebuild regularly; pin reviewed image digests when introducing a controlled release pipeline. The current Google font imports require outbound access during builds. Linux builds avoid Windows standalone symlink restrictions.

## Local verification

Run from the repository root with Docker running in Linux container mode:

```sh
docker build --check .
docker build --progress=plain -t aia-home-solution-bd:local .
docker run --detach --name aia-phase1 --init --restart unless-stopped -p 127.0.0.1:3000:3000 aia-home-solution-bd:local
docker logs aia-phase1
docker inspect --format '{{.State.Health.Status}}' aia-phase1
docker exec aia-phase1 id
curl http://localhost:3000/
```

Wait for the first health-check interval before expecting `healthy`. On Windows PowerShell use `curl.exe` for the HTTP check. Stop the test container with `docker stop aia-phase1`. Use a fresh container name for another run if retaining the stopped container.

Source checks: `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`. On Windows use `pnpm.cmd` if PowerShell blocks the pnpm script. The standalone container uses its own start command; `pnpm start` remains available for conventional local production testing.

## Dokploy setup (instructions only)

1. Create an Application connected to the intended repository and branch when deployment is authorized. Select **Dockerfile** build type, Dockerfile path `Dockerfile`, context `.`, and final stage `runner` (or leave target unset).
2. If the repository contains this app in a subdirectory, set context to that app directory and resolve the Dockerfile relative to it. Do not send a parent directory containing unrelated projects or secrets.
3. Route the application domain through Dokploy's reverse proxy to container port **3000**, HTTP internally. Enable HTTPS at the proxy. Do not publish the app port directly on the VPS; expose only the proxy's public ports.
4. Keep `PORT=3000`, `HOSTNAME=0.0.0.0`, and `NODE_ENV=production`. Use runtime environment settings for server secrets. No build arguments or secrets are needed now. Do not override the start command: the image runs `node server.js`.
5. Allow registry, npm registry and Google font access on the build host. Verify container health, domain HTTPS, logs and static assets in a staging environment before any authorized production release.

## Environment variables and secrets

| Variable | Phase | Handling |
| --- | --- | --- |
| `NODE_ENV` | Runtime | Defaults to `production` in image. |
| `PORT` | Runtime | Defaults to `3000`; keep aligned with proxy and health check. |
| `HOSTNAME` | Runtime | Defaults to `0.0.0.0` for container networking. |
| `NEXT_TELEMETRY_DISABLED` | Build and runtime | Defaults to `1`. |
| `DATABASE_URL` | Future runtime only | Server secret; currently unused and unnecessary. |
| `NEXT_PUBLIC_*` | Future build time | Public browser values baked into bundles; never put secrets here. Rebuild to change them. |

The committed `.env.example` contains defaults and a commented placeholder only. Real `.env` files are ignored by Git and excluded from Docker context along with npm credentials and private keys. Never put secrets in Docker `ARG`, `ENV`, committed configuration, client components, build logs or public variables. Inject future database credentials through Dokploy runtime settings; do not print connection strings. If future builds genuinely need secrets, use BuildKit secret mounts and review whether generated output contains sensitive data.

## Bangladesh latency and future database work

Benchmark candidate Bangladesh and nearby Singapore VPS locations from Bangladesh mobile and broadband networks before choosing a region. Place the app and future database in the same private region/network. Keep the process running to avoid cold starts; use a CDN with Bangladesh or nearby edge coverage for static assets and preserve Next.js hashed asset cache headers. Do not indiscriminately cache HTML or personalized responses. This image does not by itself guarantee latency; measure TTFB, LCP and p95 response times from the target audience.

When PostgreSQL is introduced, use a separate database service on a private network, a least-privilege application role, backups and verified TLS as required by the provider. The database hostname must be reachable from the app container (`localhost` would refer to the app itself). Add Prisma client generation to the Linux builder, verify traced runtime assets, and run reviewed migrations as a separate release step rather than on every app startup. Never publish port 5432 publicly. Plan pooling and connection limits before increasing replicas. Multiple app replicas will also require a review of shared Next.js caching and deployment consistency.
