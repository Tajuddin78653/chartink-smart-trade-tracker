FROM n8nio/n8n:latest

USER root
RUN apk add --no-cache curl

# Render injects $PORT — n8n must listen on it
ENV N8N_PORT=${PORT:-5678}
ENV N8N_HOST=0.0.0.0

USER node

CMD ["n8n", "start"]
