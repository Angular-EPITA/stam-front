#!/bin/bash

# Script to initialize and start STAM Frontend with OpenTelemetry monitoring
# Usage: ./start-monitoring.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}STAM Frontend - Observability Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed and running${NC}"

# Create log directories if they don't exist
echo -e "${YELLOW}Creating required directories...${NC}"
mkdir -p otel-collector-logs
mkdir -p grafana

# Start Docker services using docker compose
echo -e "${YELLOW}Starting OpenTelemetry services...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
echo -e "${YELLOW}Checking service health...${NC}"

# Check OTLP Collector
if curl -s http://localhost:13133 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OTLP Collector is running${NC}"
else
    echo -e "${YELLOW}⚠ OTLP Collector is starting (may take a moment)...${NC}"
fi

# Check Grafana
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Grafana is running (http://localhost:3000)${NC}"
else
    echo -e "${YELLOW}⚠ Grafana is starting (may take a moment)...${NC}"
fi

# Check Jaeger
if curl -s http://localhost:16686 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Jaeger is running (http://localhost:16686)${NC}"
else
    echo -e "${YELLOW}⚠ Jaeger is starting (may take a moment)...${NC}"
fi

# Check Prometheus
if curl -s http://localhost:9090 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prometheus is running (http://localhost:9090)${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus is starting (may take a moment)...${NC}"
fi

# Check Loki
if curl -s http://localhost:3100 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Loki is running${NC}"
else
    echo -e "${YELLOW}⚠ Loki is starting (may take a moment)...${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Dashboards available at:"
echo -e "  ${YELLOW}Grafana:${NC}     http://localhost:3000    (admin/admin)"
echo -e "  ${YELLOW}Jaeger:${NC}      http://localhost:16686   (Traces)"
echo -e "  ${YELLOW}Prometheus:${NC}  http://localhost:9090    (Metrics)"
echo -e "  ${YELLOW}Loki:${NC}        http://localhost:3100    (Logs API)"
echo ""
echo -e "${YELLOW}Note: Services will be fully ready in 30-60 seconds${NC}"
echo -e "${YELLOW}Starting frontend development server...${NC}"
echo ""
npm run start:local

