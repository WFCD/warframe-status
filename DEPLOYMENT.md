# Deployment Guide

## Docker

### Build and run

```bash
docker pull ghcr.io/wfcd/warframe-status:latest

docker run -d \
  --name warframe-status \
  -p 3001:3001 \
  -v ./caches:/app/caches \
  ghcr.io/wfcd/warframe-status:latest
```

Local builds can tag the same name: `docker build -t ghcr.io/wfcd/warframe-status:latest .`

### Docker Compose

```bash
cp docker-compose.example.yml docker-compose.yml
docker compose up -d
```

`docker-compose.example.yml` runs the API directly on the host network stack. Use it when the host already has working egress to Warframe content servers.

## Cloudflare WARP sidecar

Warframe worldstate and related content endpoints are geo-restricted. If the host cannot reach them, route the container through [Cloudflare WARP](https://developers.cloudflare.com/warp-client/) using a sidecar.

The API container shares the WARP container's network namespace (`network_mode: service:warp`). All outbound traffic from warframe-status then egresses through WARP. Publish ports on the `warp` service, not on `warframestatus`.

### Quick start

```bash
cp docker-compose.warp.example.yml docker-compose.yml
docker compose up -d
```

Wait for WARP registration (check `docker compose logs -f warp`), then verify:

```bash
curl http://localhost:8080/heartbeat
curl http://localhost:8080/pc/alerts
```

### Requirements

- Linux host with Docker
- `NET_ADMIN` capability for the WARP container (included in the example compose file)
- Persistent volume for `/var/lib/cloudflare-warp` (registration state)

### Optional configuration

| Variable | Purpose |
| :-- | :-- |
| `WARP_LICENSE_KEY` | WARP+ license for higher throughput |
| `BETA_FIX_HOST_CONNECTIVITY=1` | Work around host connectivity issues when Zero Trust split tunnels intercept Docker traffic ([details](https://github.com/cmj2002/warp-docker)) |

### CI

Pull-request and release tests use the same WARP sidecar image (`caomingjun/warp`) via [`.github/scripts/ci-warp.sh`](./.github/scripts/ci-warp.sh):

- **Test job** — starts WARP, runs `npm test` in a Node container with `network_mode: container:warp`
- **Docker image job** — builds the image, runs it behind WARP the same way as `docker-compose.warp.example.yml`, then checks `/heartbeat` and `/pc/alerts` on host port `18080` (CI uses a non-default port so parallel jobs do not collide on shared runners)

Container names are scoped per job and run (`warp-<job>-<run_id>`) so Test and Docker image can run concurrently.

No WireGuard config or Cloudflare Zero Trust secrets are required.

If WARP registration fails in CI, check `docker logs warp` in the job output. First connect can take up to ~60s; worldstate may take up to ~2 minutes on cold start.

### Alternative: SOCKS proxy

The `caomingjun/warp` image also exposes a SOCKS5/HTTP proxy on port 1080. warframe-status does not read proxy environment variables today; prefer the sidecar `network_mode` pattern above for full egress routing without application changes.

## Environment variables

See [README.md](./README.md#env-variables) for the full list. Common production settings:

| Key | Default | Notes |
| :-- | :-- | :-- |
| `HOSTNAME` | `0.0.0.0` | Set by the Dockerfile |
| `PORT` | `3001` | Set by the Dockerfile |
| `USE_WORLDSTATE` | enabled | Set `false` to disable live worldstate |
| `BUILD` | — | Set to `build` to rebuild caches on startup |
| `USE_CLUSTER` | — | Set `true` for built-in Node cluster mode |

## Health check

```bash
curl http://localhost:3001/heartbeat
```

Expected response:

```json
{ "message": "Success", "code": 200 }
```
