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

## Project Status

### Completed Features
- [x] **Microservice Orchestration**: Full docker-compose stack with robust healthchecks and Kafka producer/consumer exponential retry loops.
- [x] **API Gateway Path Rewriting**: Seamless routing of `/api/rides`, `/api/users`, and `/api/notifications` to downstream services without 404 stripping errors.
- [x] **Global Geocoding Integration**: Integrated **OpenStreetMap Nominatim** in the rider UI to allow real-world address searching instead of static mock locations.
- [x] **PostGIS Geospatial Matching**: Replaced mocked matching with a real DB-backed driver pool. Uses `ST_DWithin` to dynamically match riders to the nearest live driver within a 5km radius.
- [x] **Secure JWT Authentication**: Built `bcryptjs` and `jsonwebtoken` auth flows into the `user-service`. Added dynamic `<Auth />` portals forcing users to login/signup before accessing map UI. 
- [x] **Real-time Map Synching**: The Driver App shows the Rider's exact pickup/dropoff points. The Rider App displays a live moving car marker  with updating ETAs via Socket.io.
- [x] **UI State Persistence**: Configured `sessionStorage` in both micro-frontends so that accidental page refreshes do not disrupt an active trip state.
- [x] **Trip Lifecycle Event Flow**: Added a dedicated "End Trip" endpoint and button for drivers that updates PostgreSQL and emits a `RIDE_COMPLETED` Kafka event to smoothly detach users.

### Future TODOs
- [ ] **Stripe Payments**: Add payment gateway integration to process the calculated fare once `RIDE_COMPLETED` is triggered.
- [ ] **Driver Earnings Dashboard**: Build a React interface for drivers to track their daily/weekly payouts and trip history.
- [ ] **In-App Messaging**: Implement a real-time chat modal via Socket.io so the driver and rider can communicate prior to pickup.
- [ ] **Trip Cancellations**: Add handlers for rider/driver cancellations, returning the driver to the available pool.
- [ ] **Environment Hardening**: Transition hardcoded credentials and salts in the microservices to a centralized secret manager for production.

## Project Overview
This repository contains the source code for the **Ride Hailing System** project, part of the Days-back collection of modern web applications. It features high-fidelity UI/UX, robust backend architecture, and seamless interactive workflows.

## Technical Deep Dive
This **advanced** project implementation leverages state-of-the-art patterns for scalability, performance, and maintainability. Key features include complex state synchronization, micro-interaction animations, and an optimized design system built on high-fidelity tokens.
