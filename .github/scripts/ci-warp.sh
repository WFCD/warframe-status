#!/usr/bin/env bash
# Start caomingjun/warp and run commands in a container that shares its network.
# Used in CI so test egress matches the docker-compose.warp.example.yml deployment path.
set -euo pipefail

job_scope="${GITHUB_JOB:-local}"
run_scope="${GITHUB_RUN_ID:-$$}"
WARP_CONTAINER="${WARP_CONTAINER:-warp-${job_scope}-${run_scope}}"
STATUS_CONTAINER="${STATUS_CONTAINER:-warframe-status-${job_scope}-${run_scope}}"
WARP_IMAGE="${WARP_IMAGE:-"caomingjun/warp@sha256:905b91c3fe197a625611064ef0664f27e9ecdd0a30a91c4ae7046e06a2bf2643"}"
NODE_IMAGE="${NODE_IMAGE:-node:krypton-bookworm}"
WORKSPACE="${GITHUB_WORKSPACE:-$PWD}"
WARP_HOST_PORT="${WARP_HOST_PORT:-8080}"
STATUS_PORT="${STATUS_PORT:-3001}"
SMOKE_DATA_PATH="${SMOKE_DATA_PATH:-/factions}"
CURL_OPTS=(--connect-timeout 5 --max-time 10)

cleanup() {
  docker rm -f "$STATUS_CONTAINER" "$WARP_CONTAINER" >/dev/null 2>&1 || true
}

start_warp() {
  local -a port_args=()
  if [[ -n "${WARP_PORTS-}" ]]; then
    port_args+=(-p "$WARP_PORTS")
  fi

  docker rm -f "$WARP_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$WARP_CONTAINER" \
    "${port_args[@]}" \
    --device-cgroup-rule 'c 10:200 rwm' \
    --cap-add NET_ADMIN \
    --cap-add MKNOD \
    --cap-add AUDIT_WRITE \
    --sysctl net.ipv6.conf.all.disable_ipv6=0 \
    --sysctl net.ipv4.conf.all.src_valid_mark=1 \
    -e WARP_SLEEP=2 \
    "$WARP_IMAGE" >/dev/null
}

wait_for_warp() {
  for attempt in $(seq 1 45); do
    if docker run --rm --network "container:${WARP_CONTAINER}" curlimages/curl:8.12.1 \
      -sf "${CURL_OPTS[@]}" https://www.cloudflare.com/cdn-cgi/trace | grep -Eq 'warp=(on|plus)'; then
      echo "WARP connected"
      sleep 5
      return 0
    fi
    echo "Waiting for WARP (${attempt}/45)..."
    sleep 2
  done

  echo "WARP failed to connect"
  docker logs --tail 80 "$WARP_CONTAINER" 2>&1 || true
  return 1
}

run_with_warp() {
  local -a docker_args=(
    docker run --rm --network "container:${WARP_CONTAINER}"
    -v "${WORKSPACE}:/app" -w /app
    -v "${HOME}/.npm:/root/.npm"
    -e HUSKY=0
  )
  local var
  for var in CI NODE_ENV TWITTER_KEY TWITTER_SECRET TWITTER_TIMEOUT TWITTER_BEARER_TOKEN WFINFO_FILTERED_ITEMS WFINFO_PRICES; do
    if [[ -n "${!var:-}" ]]; then
      docker_args+=(-e "${var}=${!var}")
    fi
  done
  docker_args+=("$NODE_IMAGE" bash -lc "$*")

  "${docker_args[@]}"
}

# Curl the API inside the shared WARP network namespace. Host curls to published
# ports often fail because WARP intercepts Docker bridge traffic.
smoke_curl() {
  local path="$1"
  docker run --rm --network "container:${WARP_CONTAINER}" curlimages/curl:8.12.1 \
    -sf "${CURL_OPTS[@]}" "http://127.0.0.1:${STATUS_PORT}${path}"
}

# Prints "body" then "http_code" on the last line.
smoke_probe() {
  local path="$1"
  docker run --rm --network "container:${WARP_CONTAINER}" curlimages/curl:8.12.1 \
    -sS "${CURL_OPTS[@]}" -w $'\n%{http_code}' "http://127.0.0.1:${STATUS_PORT}${path}"
}

smoke_data_ok() {
  local path="$1"
  local body

  body="$(smoke_curl "$path" 2>/dev/null)" || return 1
  grep -qE '^[\[{]' <<<"$body"
}

smoke_log_failure() {
  local label="$1"
  local path="$2"
  local probe body code

  echo "::error title=${label}::${label} — see job log for probe output and container logs"
  probe="$(smoke_probe "$path" 2>&1 || true)"
  body="${probe%$'\n'*}"
  code="${probe##*$'\n'}"

  echo "${label} probe: GET ${path}"
  echo "HTTP status: ${code:-unknown}"
  if [[ -n "$body" ]]; then
    echo "Response preview:"
    printf '%s\n' "$body" | head -c 500
    echo
  else
    echo "Response preview: (empty)"
  fi

  echo "--- ${STATUS_CONTAINER} (last 80 lines) ---"
  docker logs --tail 80 "$STATUS_CONTAINER" 2>&1 || true
  echo "--- ${WARP_CONTAINER} (last 40 lines) ---"
  docker logs --tail 40 "$WARP_CONTAINER" 2>&1 || true
}

smoke_image() {
  local image="$1"

  docker rm -f "$STATUS_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$STATUS_CONTAINER" \
    --network "container:${WARP_CONTAINER}" \
    "$image" >/dev/null

  for attempt in $(seq 1 45); do
    if smoke_curl /heartbeat >/dev/null; then
      echo "Heartbeat OK"
      break
    fi
    if [[ "$attempt" -eq 45 ]]; then
      smoke_log_failure "Heartbeat failed" /heartbeat
      return 1
    fi
    sleep 2
  done

  # Static data endpoint — bundled in warframe-worldstate-data, no live worldstate fetch.
  for attempt in $(seq 1 30); do
    if smoke_data_ok "$SMOKE_DATA_PATH"; then
      echo "Data endpoint OK (${SMOKE_DATA_PATH})"
      return 0
    fi
    if (( attempt % 10 == 0 )); then
      echo "Waiting for data endpoint (${attempt}/30)..."
    fi
    if [[ "$attempt" -eq 30 ]]; then
      smoke_log_failure "Data endpoint not ready" "$SMOKE_DATA_PATH"
      return 1
    fi
    sleep 2
  done
}

case "${1:-}" in
  start)
    start_warp
    wait_for_warp
    ;;
  run)
    shift
    if [[ $# -lt 1 ]]; then
      echo "usage: $0 run <shell command>" >&2
      exit 1
    fi
    trap cleanup EXIT
    start_warp
    wait_for_warp
    run_with_warp "$@"
    ;;
  smoke)
    shift
    if [[ $# -lt 1 ]]; then
      echo "usage: $0 smoke <image>" >&2
      exit 1
    fi
    : "${WARP_PORTS:=${WARP_HOST_PORT}:3001}"
    trap cleanup EXIT
    start_warp
    wait_for_warp
    smoke_image "$1"
    ;;
  *)
    echo "usage: $0 start | run <shell command> | smoke <image>" >&2
    exit 1
    ;;
esac
