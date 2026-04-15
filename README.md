# stam-front

Frontend Angular (v20) de la plateforme STAM — catalogue de jeux vidéo.

## Pré-requis

- Node.js 20+
- npm

## Démarrage rapide (développement local)

```bash
npm install
npm run start:local
```

Frontend : http://localhost:4200 (proxy automatique vers l'API sur `localhost:8080`)

## Build de production

```bash
npx ng build --configuration production
```

Les fichiers sont générés dans `dist/stam-front/browser/`.

## Stack technique

| Composant | Version |
| :--- | :--- |
| Angular | 20.3 |
| TypeScript | 5.9 |
| Tailwind CSS | 3.4 |
| RxJS | 7.8 |

## Architecture

- **Standalone components** avec le nouveau control flow Angular (`@if`, `@for`)
- **JWT Authentication** : `AuthService` + `HttpInterceptor` avec refresh automatique sur 401
- **Route guards** : `authGuard` protège les routes `/admin/**`
- **Proxy** : `proxy.local.conf.json` → API locale, `proxy.conf.json` → API Docker

