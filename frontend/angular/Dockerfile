# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Build argument pour l'URL de l'API
ARG NG_API_URL=http://localhost:8080
ENV NG_API_URL=$NG_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/elibrary-angular /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

