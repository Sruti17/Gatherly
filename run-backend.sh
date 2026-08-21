#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${EVENTBRITE_ACCESS_TOKEN:-}" ]]; then
  read -r -s -p "Eventbrite private token (press Enter to skip): " EVENTBRITE_ACCESS_TOKEN
  printf '\n'
fi

if [[ -z "$EVENTBRITE_ACCESS_TOKEN" ]]; then
  printf 'Warning: Eventbrite access token not set; nearby Eventbrite events will be unavailable.\n' >&2
fi

export EVENTBRITE_ACCESS_TOKEN
exec ./mvnw spring-boot:run
