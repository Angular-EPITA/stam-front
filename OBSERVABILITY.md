# OpenTelemetry Observability Guide

Ce guide explique comment utiliser et configurer l'observabilité OpenTelemetry pour l'application STAM Frontend.

## Architecture

L'observabilité est basée sur la stack OpenTelemetry standard :

```
┌─────────────────────────────────────┐
│   STAM Frontend (Angular)           │
│  - OpenTelemetry SDK                │
│  - Automatic HTTP tracing            │
│  - Custom logging                    │
└─────────────┬───────────────────────┘
              │ OTLP (HTTP)
              ▼
┌─────────────────────────────────────┐
│  OpenTelemetry Collector             │
│  - Receives traces, metrics, logs    │
│  - Exports to multiple backends      │
└──────┬──────────────┬────────────────┘
       │              │
       ▼              ▼
   ┌────────┐    ┌──────────┐
   │ Jaeger │    │   Loki   │
   │(Traces)│    │ (Logs)   │
   └────────┘    └──────────┘
       │              │
       └──────┬───────┘
              ▼
      ┌────────────────┐
      │  Prometheus    │
      │  (Metrics)     │
      └────────────────┘
              │
              ▼
      ┌────────────────┐
      │    Grafana     │
      │(Visualization)│
      └────────────────┘
```

## Components

### Frontend (OtelService)

Le service `OtelService` dans `src/app/observability/otel.service.ts` fournit :

- **Logging** : Capture automatique des logs console (log, warn, error, debug)
- **HTTP Tracing** : Traçage automatique des requêtes HTTP via `otelInterceptor`
- **Metrics** : Envoi des données au collector OTLP

### Configuration OpenTelemetry

Le fichier `src/app/observability/otel.config.ts` initialise :

- **WebTracerProvider** : Collecte les traces
- **FetchInstrumentation** : Trace automatiquement les requêtes Fetch
- **XMLHttpRequestInstrumentation** : Trace automatiquement les requêtes XHR (Angular HttpClient)
- **OTLP Exporter** : Exporte vers le collector (HTTP)

### Docker Stack

- **OpenTelemetry Collector** : Agrège traces, métriques, logs
- **Prometheus** : Stocke les métriques
- **Loki** : Stocke les logs
- **Jaeger** : Interface pour visualiser les traces distribuées
- **Grafana** : Dashboard centralisé

## Démarrage

### 1. Démarrer les services d'observabilité

```bash
# Dans le dossier stam-front
docker-compose up -d
```

Cela démarre :
- OTLP Collector sur `localhost:4318`
- Prometheus sur `localhost:9090`
- Loki sur `localhost:3100`
- Grafana sur `localhost:3000`
- Jaeger sur `localhost:16686`

### 2. Démarrer l'application Frontend

```bash
npm start
# ou pour le développement local
npm run start:local
```

L'application sera accessible sur `http://localhost:4200`

### 3. Accéder à Grafana

```
URL: http://localhost:3000
Username: admin
Password: admin
```

Le dashboard "STAM Frontend - Observability Dashboard" s'affiche automatiquement.

## Utilisation

### Logging dans votre code

```typescript
import { OtelService } from './observability/otel.service';

export class MyComponent {
  constructor(private otel: OtelService) {}

  myMethod() {
    // Simple logging
    this.otel.info('Information message');
    
    // Logging with context
    this.otel.debug('Debug message', 'MyComponent.myMethod');
    
    // Logging with data
    this.otel.error('An error occurred', 'MyComponent.myMethod', {
      errorCode: 'ERR_001',
      details: 'Something went wrong'
    });
    
    // Warnings
    this.otel.warn('This is deprecated', 'MyComponent.myMethod');
  }
}
```

### Viewing Traces

```
http://localhost:16686
```

Cherchez les traces pour le service "stam-front". Vous verrez :
- Timing de chaque requête HTTP
- Spans enfants pour les opérations DOM
- Erreurs et exceptions

### Viewing Logs

Dans Grafana, allez au dashboard et consultez le panneau "Application Logs" qui affiche les logs filtrés pour le service stam-front.

### Viewing Metrics

Prometheus collecte automatiquement les métriques du collector. Consultez `http://localhost:9090` pour explorer les métriques disponibles.

## Configuration

### Modifier l'endpoint OTLP

Si vous devez changer l'endpoint OTLP (par ex. pour une instance de production), modifiez dans `otel.config.ts` :

```typescript
const otlpEndpoint = 'https://your-otel-collector.com:4318/v1/traces';
```

### Changer le level de log

Dans `otel-collector-config.yaml` :

```yaml
telemetry:
  logs:
    level: debug  # ou info, warn, error
```

### Ajouter plus de données aux traces

Modifiez `otel.config.ts` pour ajouter des attributs custom :

```typescript
span.setAttributes({
  'custom.user_id': userId,
  'custom.page': currentPage,
  // ...
});
```

## Monitoring en Production

Pour la production, utilisez un backend OpenTelemetry cloud :

1. **Datadog** : Remplacez l'exporter par `@opentelemetry/exporter-trace-datadog`
2. **New Relic** : Utilisez leur collector OTLP
3. **Observability Co.** : Utilisez leur stack complète

Configurez simplement l'endpoint OTLP dans `otel.config.ts`.

## Dépannage

### Les traces n'apparaissent pas

1. Vérifiez que le collector est en cours d'exécution : `docker-compose ps`
2. Vérifiez les logs du collector : `docker-compose logs otel-collector`
3. Vérifiez la console du navigateur pour les erreurs
4. Assurez-vous que Jaeger est accessible sur `http://localhost:16686`

### Les logs n'apparaissent pas

1. Vérifiez que Loki fonctionne : `docker-compose logs loki`
2. Vérifiez dans Grafana que la source de données Loki est configurée
3. Cherchez les logs avec le bon label dans le dashboard

### Haute utilisation mémoire

Réduisez la taille du batch dans `otel-collector-config.yaml` :

```yaml
processors:
  batch:
    send_batch_size: 50  # Réduire de 100 à 50
    timeout: 5s          # Réduire de 10s à 5s
```

## Performance

L'observabilité OpenTelemetry a un impact minimal sur les performances :

- **Overhead réseau** : ~1-5% pour les requêtes HTTP
- **CPU** : <1% overhead supplémentaire
- **Mémoire** : ~10-20 MB pour le buffer de logs

L'envoi des logs par batch (par défaut 10 logs) minimise l'impact.

## Documentation supplémentaire

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Collector Configuration](https://opentelemetry.io/docs/collector/configuration/)
- [Grafana Docs](https://grafana.com/docs/)
- [Jaeger Docs](https://www.jaegertracing.io/docs/)

## Scripts disponibles

```bash
# Démarrer les services d'observabilité
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs du collector
docker-compose logs -f otel-collector

# Voir tous les logs
docker-compose logs -f

# Nettoyer tous les volumes (ATTENTION: données supprimées)
docker-compose down -v
```

## Support

Pour des problèmes ou des questions, consultez :
1. Les logs du collector
2. La console du navigateur (F12)
3. Les logs de l'application dans Grafana/Loki
