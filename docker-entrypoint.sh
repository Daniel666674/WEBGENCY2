#!/bin/sh
set -e

# crm-config.json is gitignored (it's per-deployment business config, not
# something to commit) and docker-compose.yml bind-mounts it as a single
# file. If that file doesn't exist on the host yet — true on a fresh clone
# — Docker silently creates the mount point as an empty DIRECTORY instead,
# which then breaks every read/write against it. Self-heal that here: if
# it's a directory, replace it with the real template file.
if [ -d /app/crm-config.json ]; then
  echo "crm-config.json was mounted as an empty directory (fresh host clone) — fixing..."
  rmdir /app/crm-config.json
  cp /app/public/crm-config.json /app/crm-config.json
fi
if [ ! -f /app/crm-config.json ]; then
  cp /app/public/crm-config.json /app/crm-config.json
fi

# Data lives in Turso (TURSO_DATABASE_URL/TURSO_AUTH_TOKEN), not on the
# container filesystem — the schema is created automatically on first boot
# via ensureSchema() (src/instrumentation.ts). Nothing to initialize here.

exec npm start
