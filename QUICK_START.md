# Quick Start Guide - OpenTelemetry Monitoring

## 5-Minute Setup

### Step 1: Start Observability Stack

```bash
# Run once to start all Docker services
docker-compose up -d
```

Or using npm scripts:

```bash
npm run otel:up
```

### Step 2: Start Frontend App

In another terminal:

```bash
# Option A: Standard development server
npm start

# Option B: With local proxy (recommended for full testing)
npm run start:local

# Option C: One command that does both (requires Docker)
./start-monitoring.sh
```

### Step 3: Open Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** (Dashboard) | http://localhost:3000 | admin/admin |
| **Jaeger** (Traces) | http://localhost:16686 | - |
| **Prometheus** (Metrics) | http://localhost:9090 | - |
| **Frontend App** | http://localhost:4200 | - |

## Usage Examples

### Using OtelService in Components

```typescript
import { Component } from '@angular/core';
import { OtelService } from './app/observability/otel.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  constructor(private otel: OtelService) {
    // Log component initialization
    this.otel.info('Dashboard component initialized', 'DashboardComponent');
  }

  loadData() {
    this.otel.debug('Loading data...', 'DashboardComponent.loadData');
    
    // Your data loading code
    
    this.otel.info('Data loaded successfully', 'DashboardComponent.loadData', {
      itemCount: 42,
      duration: '150ms'
    });
  }

  handleError(error: Error) {
    this.otel.error(
      'Failed to load data: ' + error.message,
      'DashboardComponent.loadData',
      { error: error.toString() }
    );
  }
}
```

## Viewing Your Data

### Traces in Jaeger

1. Go to http://localhost:16686
2. Select "stam-front" service from dropdown
3. Click "Find Traces"
4. See all HTTP requests and their duration

### Logs in Grafana

1. Go to http://localhost:3000 (admin/admin)
2. Go to Explore (left sidebar)
3. Select "Loki" data source
4. Search with: `{service_name="stam-front"}`

### Metrics in Prometheus

1. Go to http://localhost:9090
2. Click "Graph"
3. Enter query like: `up{job="otel-collector"}`
4. View metrics over time

## Stopping Services

```bash
# Stop all services but keep data
docker-compose stop

# Stop and remove containers (keep volumes/data)
docker-compose down

# Stop, remove containers AND delete all data
docker-compose down -v

# Using npm script
npm run otel:down
```

## Troubleshooting

### Services won't start

```bash
# Check Docker status
docker-compose ps

# View service logs
docker-compose logs

# Specific service logs
docker-compose logs otel-collector
```

### No traces appearing

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make requests in the app
4. Check if requests appear
5. Check collector logs: `docker-compose logs otel-collector`

### High memory usage

Reduce batch size in `otel-collector-config.yaml`:
```yaml
processors:
  batch:
    send_batch_size: 50    # Reduce from 100
    timeout: 5s            # Reduce from 10s
```

Then restart: `docker-compose restart otel-collector`

## Available npm Scripts

```bash
# Observability
npm run otel:up         # Start Docker services
npm run otel:down       # Stop Docker services
npm run otel:logs       # View collector logs
npm run otel:full       # Start with Jaeger support
npm run otel:clean      # Remove all data

# Development
npm start               # Standard server
npm run start:local     # With local proxy
npm run start:stam      # With STAM API proxy
npm run build           # Production build
npm run test            # Run tests
npm run lint            # Lint code

# Combined
npm run monitor         # Start otel + start:local
npm run monitor:full    # Start otel (full) + start:local
```

## Full Documentation

See [OBSERVABILITY.md](./OBSERVABILITY.md) for comprehensive documentation.
