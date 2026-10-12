# ---- Build stage: compile the React app into static files ----
FROM node:24-slim AS build

WORKDIR /app

# copy the package files first so Docker can cache "npm ci"
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Run stage: nginx serves the files and passes /api on to the backend ----
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
