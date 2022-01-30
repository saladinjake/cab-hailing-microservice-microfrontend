# 01 - Ride-Hailing System (Uber-like OS)

A distributed, event-driven ride-hailing platform built with Node.js microservices and React micro-frontends.

## Architecture

### Backend Microservices
| Service | Port | Tech | Responsibility |
|---|---|---|---|
| api-gateway | 5000 | Express, http-proxy-middleware | Routes requests to downstream services |
| user-service | 5001 | Express, MongoDB | Rider/Driver auth & profiles |
| ride-service | 5002 | Express, PostgreSQL + PostGIS | Ride lifecycle, geo matching, surge pricing |
| notification-service | 5003 | Express, Socket.io, Kafka consumer | Real-time tracking & push events |

### Frontend Micro-Frontends (Module Federation)
| App | Port | Responsibility |
|---|---|---|
| host-app | 3000 | Shell — routing, shared nav, lazy loads remotes |
| rider-app | 3001 | Rider portal — booking, live driver tracking |
| driver-app | 3002 | Driver portal — accept rides, navigation status |

### Infrastructure (Docker Compose)
- **Kafka + Zookeeper** — event bus between ride-service and notification-service
- **PostgreSQL + PostGIS** — geospatial ride storage (ST_DWithin queries)
- **MongoDB** — user profile storage
- **Redis** — pub/sub & driver location cache

## Running Locally

### Start infrastructure
```bash
docker-compose up -d
```

### Start each backend service (separate terminals)
```bash
cd backend/api-gateway && npm run dev
cd backend/user-service && npm run dev
cd backend/ride-service && npm run dev
cd backend/notification-service && npm run dev
```

### Start each micro-frontend (separate terminals)
```bash
cd frontend/rider-app && npm start   # port 3001
cd frontend/driver-app && npm start  # port 3002
cd frontend/host-app && npm start    # port 3000
```

Then open **http://localhost:3000** and navigate to `/rider` or `/driver`.

## Key Patterns
- **Event-Driven**: `ride-service` produces Kafka events (`ride-events` topic); `notification-service` consumes them and fans out via Socket.io.
- **Geo Matching**: PostGIS `ST_DWithin` queries match riders to nearest available drivers within 5km.
- **Surge Pricing**: Dynamic multiplier applied per-request based on demand signal.
- **Module Federation**: `rider-app` and `driver-app` expose their root `App` component; the `host-app` lazy-loads them at runtime with `React.lazy`.
