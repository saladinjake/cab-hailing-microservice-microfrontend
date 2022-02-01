# Ride Hailing System

A full-stack ride-hailing platform built with a microservices architecture on the backend and a module federation microfrontend setup on the frontend. The system supports real-time ride matching, driver management, and rider booking flows.

## Architecture Overview

The project is split into two main sections: a backend composed of independently deployable services, and a frontend built as separate microfrontend applications hosted under a single shell.

## Backend Services

The backend is organized as a collection of Node.js microservices, each responsible for a specific domain, coordinated through a central API gateway.

- api-gateway: Acts as the single entry point for all client requests. Handles authentication verification, request routing, and load distribution to downstream services.
- user-service: Manages user registration, login, profile updates, and authentication token generation for both riders and drivers.
- ride-service: Handles the core business logic of ride creation, status tracking (requested, accepted, in-progress, completed, cancelled), fare calculation, and driver-rider matching.
- notification-service: Responsible for sending real-time push notifications and email alerts triggered by ride status changes and system events.

Each service communicates with its own database and interacts with other services via REST calls or message events routed through the gateway.

## Frontend Applications

The frontend is structured as a module federation setup consisting of three independently built React applications served together through a host shell.

- host-app: The container shell that orchestrates and loads the remote microfrontend modules at runtime. Handles shared routing and global layout.
- rider-app: The rider-facing application. Allows users to request rides, track drivers in real time, view fare estimates, and access ride history.
- driver-app: The driver-facing application. Allows drivers to accept or reject incoming ride requests, view navigation details, and manage their availability status.

## Technology Stack

Backend: Node.js, Express, MongoDB, JWT authentication, Docker, Docker Compose.
Frontend: React, Webpack Module Federation, Tailwind CSS, Docker.

## Running the Project

The entire system is orchestrated with Docker Compose. Bring up all services with:

    docker-compose up --build

Each service exposes its own port and the API gateway is the primary interface for the frontend applications.

Last updated: 2026-05-01
