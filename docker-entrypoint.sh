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

# data/ is a host volume mount, so whatever got baked into the image at
# build time never actually reaches the running container — the volume
# shadows it. Initialize the *mounted* database here, at container start,
# and only if it doesn't already exist (a fresh volume, or a fresh clone
# without data/crm.db committed) so re-deploys never touch existing data.
if [ ! -f /app/data/crm.db ]; then
  echo "No existing database at data/crm.db — initializing..."
  npx tsx scripts/init.ts
fi

exec npm start
