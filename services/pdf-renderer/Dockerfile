# The Playwright image already carries Chromium and every system library it
# needs. Installing the browser onto a plain node image is possible but means
# tracking that dependency list by hand, and it drifts.
#
# The tag must match the `playwright` version in package.json — a mismatched
# browser build refuses to launch. Note that Microsoft's image releases lag
# the npm package by a version or two; check
# https://mcr.microsoft.com/v2/playwright/tags/list before bumping either one.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

ENV NODE_ENV=production
WORKDIR /app

# Dependencies first, so a code change does not reinstall them.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

# The image runs as a non-root user that the base image already provides.
USER pwuser

EXPOSE 8080
CMD ["node", "src/index.mjs"]
