# -- Base Node ---
FROM node:14-alpine AS base

ENV CHROME_BIN="/usr/bin/chromium-browser" \
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN set -x \
  && apk update \
  && apk upgrade \
  && apk add --no-cache \
  libstdc++ \
  binutils-gold \
  curl \
  g++ \
  gcc \
  gnupg \
  libgcc \
  linux-headers \
  make \
  python3 \
  udev \
  ttf-freefont \
  openssl \
  chromium \
  && ln -sf python3 /usr/bin/python

WORKDIR /usr/src/app
COPY package*.json ./

# -- Build Base ---
FROM base AS build-base
COPY ["./.babelrc", "./.eslintrc", "./"]

# -- Dependencies Node ---
FROM build-base AS dependencies
RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production
RUN cp -R node_modules prod_node_modules
RUN npm install

# ---- Compile  ----
FROM build-base AS compile
COPY ./src ./src
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
RUN npm run build

# ---- Release  ----
FROM base AS release
COPY --from=dependencies /usr/src/app/prod_node_modules ./node_modules
COPY --from=compile /usr/src/app/dist ./dist

# Expose port and define CMD
ENV NODE_ENV production
ENV PORT 80
CMD npm run start
