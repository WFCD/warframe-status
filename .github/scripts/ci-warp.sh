#!/usr/bin/env bash
# Start caomingjun/warp and run commands in a container that shares its network.
# Used in CI so test egress matches the docker-compose.warp.example.yml deployment path.
set -euo pipefail

job_scope="${GITHUB_JOB:-local}"
run_scope="${GITHUB_RUN_ID:-$$}"
WARP_CONTAINER="${WARP_CONTAINER:-warp-${job_scope}-${run_scope}}"
STATUS_CONTAINER="${STATUS_CONTAINER:-warframe-status-${job_scope}-${run_scope}}"
WARP_IMAGE="${WARP_IMAGE:-caomingjun/warp}"
NODE_IMAGE="${NODE_IMAGE:-node:22-bookworm}"
WORKSPACE="${GITHUB_WORKSPACE:-$PWD}"
WARP_HOST_PORT="${WARP_HOST_PORT:-8080}"
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
  for attempt in $(seq 1 30); do
    if docker run --rm --network "container:${WARP_CONTAINER}" curlimages/curl:8.12.1 \
      -sf "${CURL_OPTS[@]}" https://www.cloudflare.com/cdn-cgi/trace | grep -q 'warp=on'; then
      echo "WARP connected"
      return 0
    fi
    echo "Waiting for WARP (${attempt}/30)..."
    sleep 2
  done

  echo "WARP failed to connect"
  docker logs "$WARP_CONTAINER" || true
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

smoke_image() {
  local image="$1"

  docker rm -f "$STATUS_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$STATUS_CONTAINER" --network "container:${WARP_CONTAINER}" "$image" >/dev/null

  local base_url="http://localhost:${WARP_HOST_PORT}"

  for attempt in $(seq 1 30); do
    if curl -sf "${CURL_OPTS[@]}" "${base_url}/heartbeat" >/dev/null; then
      echo "Heartbeat OK"
      break
    fi
    if [[ "$attempt" -eq 30 ]]; then
      echo "Heartbeat failed"
      docker logs "$STATUS_CONTAINER" || true
      return 1
    fi
    sleep 2
  done

  for attempt in $(seq 1 60); do
    if curl -sf "${CURL_OPTS[@]}" "${base_url}/pc/alerts" | grep -q '^\['; then
      echo "Worldstate OK through WARP"
      return 0
    fi
    if [[ "$attempt" -eq 60 ]]; then
      echo "Worldstate failed through WARP"
      docker logs "$WARP_CONTAINER" || true
      docker logs "$STATUS_CONTAINER" || true
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
