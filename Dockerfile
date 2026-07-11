FROM node:22-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# data/ is mounted as a host volume in docker-compose.yml, which shadows
# anything created here at build time — actual initialization has to happen
# at container start, against the real mounted volume. See docker-entrypoint.sh.
ENTRYPOINT ["./docker-entrypoint.sh"]
