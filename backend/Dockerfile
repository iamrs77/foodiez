FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

# copy the package files first so Docker can cache "npm ci"
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# don't run as root
USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
