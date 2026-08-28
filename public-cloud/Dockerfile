FROM nginx:1.27-alpine

ENV PORT=8080

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY . /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1
