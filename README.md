# Advanced Web Development and Frameworks

Semester V practical work for Advanced Web Development and Frameworks.

## Practical 1

Built a student portfolio using React and Vite.

### Concepts

- React functional components
- JSX
- Props
- Component composition
- Reusable components

### Components

- Header
- About
- Skills
- Projects
- Footer

---

## Practical 2

Extended the portfolio with React Router and state management.

### Routes

| Route | Component | Purpose |
|---|---|---|
| `/` | Home | Portfolio homepage |
| `/projects` | Projects | Displays projects |
| `/contact` | Contact | Contact form |
| `*` | NotFound | Handles unknown routes |

### Concepts

- BrowserRouter
- Routes
- Route
- Link
- useState
- Controlled form inputs
- Conditional rendering
- Dark/light mode
- 404 Not Found route

---

## Practical 8: Server-Side Caching & Performance Measurement

Implemented server-side in-memory caching for the task management API using `node-cache`.

### Key Features
- **In-Memory Caching**: 60-second TTL on `GET /tasks` with cache hit (`X-Cache: HIT`) and miss (`X-Cache: MISS`) tracking.
- **User Isolation**: Isolated cache keys per authenticated user (`tasks:user:<userId>`) preserving JWT authentication.
- **Cache Invalidation**: Event-driven invalidation after database write operations (`POST`, `PUT`, `DELETE`).
- **Benchmark Toggle**: `CACHE_ENABLED=true/false` environment flag to measure database vs. cache latency.
- **Observability**: `GET /api/cache/stats` endpoint for hit, miss, and invalidation statistics.
- **Detailed Documentation**: See [docs/practical-8.md](docs/practical-8.md) for full guide and performance comparison table.

---

## Practical 9: Code Splitting and Lazy Loading in React

Implemented route-level and component-level code splitting using `React.lazy()` and `Suspense` to optimize bundle size, network payload, and Time-to-Interactive (TTI).

### Key Features
- **Route-Based Lazy Loading**: Dynamic imports for `/projects` (`Projects.jsx`), `/contact` (`Contact.jsx`), and `/tasks` (`TaskManager.jsx`).
- **Selective Suspense Boundary**: `<Suspense>` wraps only the route outlet, maintaining immediate interactivity for navigation, dark/light theme toggle, and help dialog.
- **Accessible Loading Fallback**: Theme-tailored violet spinner (`LoadingFallback.jsx`) with ARIA live region (`role="status"`, `aria-live="polite"`).
- **Component-Level Lazy Loading**: Heavy interactive repository analytics dashboard (`ProjectAnalytics.jsx`) loaded on user interaction with dedicated `<Suspense>`.
- **Chunk Verification**: Separate chunks generated in `dist/assets/`, reducing initial bundle size by 3.08 kB and separating 18.1 kB of on-demand JavaScript.
- **Re-Render Optimization**: Resolved cascading re-renders in `TaskManager.jsx` flagged by `react-hooks/set-state-in-effect`.
- **Detailed Documentation**: See [docs/practical-9.md](docs/practical-9.md) for DevTools verification steps, network throttling, and performance metrics.

---

## Practical 10: Asynchronous Processing with Event-Driven Architecture (EventEmitter)

Implemented an event-driven background notification architecture using Node.js's built-in `EventEmitter` to decouple secondary concerns from the main HTTP request/response cycle.

### Key Features
- **Dedicated EventEmitter Module**: Process-local singleton emitter in `backend/events/taskEvents.js` with safe error-handling listeners.
- **Asynchronous `task-created` Event**: Logged task creation with ISO timestamp, task title, and user ID after an artificial 2-second non-blocking delay.
- **Immediate API Response Delivery**: HTTP `201 Created` is returned to the client in ~38ms, while the background notification processes asynchronously without blocking the event loop.
- **Supplementary `task-deleted` Event**: Separate listener emitting on `DELETE /tasks/:id` only after successful database deletion and cache invalidation.
- **Failure Resilience**: Isolated `try/catch` handlers inside listeners and registered `'error'` event listener prevent unhandled rejections or crashes.
- **Preserved Existing Features**: Full backward compatibility with Practical 7 JWT authentication and Practical 8 `node-cache` cache invalidation.
- **Automated Verification**: Comprehensive test suite in `backend/test/events.test.js` validating all 8 event-driven scenarios (19/19 total backend tests passing).
- **Detailed Documentation**: See [docs/practical-10.md](docs/practical-10.md) for architectural sequence diagram, timing evidence, and message queue comparison.

---

## Practical 11: Containerization with Docker and Docker Compose

Containerized the complete full-stack web application (React frontend, Node.js/Express API backend, and MongoDB database) using Docker and Docker Compose for single-command deployment.

### Key Features
- **Backend Dockerfile**: Multi-layer Node.js 20 Alpine image (`backend/Dockerfile`) with clean dependency isolation and graceful shutdown handling.
- **Frontend Dockerfile**: Multi-stage build (`frontend/Dockerfile`) compiling React with Vite and serving static assets through high-performance **Nginx** on port 5173.
- **SPA Client-Side Routing & Reverse Proxy**: Configured `frontend/nginx.conf` with `try_files` route fallback and transparent proxying for `/tasks` and `/api/` to `backend:5000`.
- **Docker Compose Orchestration**: `docker-compose.yml` defining `frontend`, `backend`, and `mongodb` services connected over an isolated bridge network (`awdf-network`).
- **Persistent Data Storage**: Named volume `mongodb_data` preserving MongoDB documents across container restarts.
- **Health Checks & Startup Sequencing**: Backend waits for MongoDB `service_healthy` before initiating connection.
- **Credential Protection**: Implemented `.dockerignore` files and `.env.example` template to prevent baking secrets into container layers while supporting both local containerized MongoDB and cloud MongoDB Atlas.
- **Detailed Documentation**: See [docs/practical-11.md](docs/practical-11.md) for architecture diagram, networking mechanics, and troubleshooting.

---

## Practical 12: Continuous Integration (CI) with GitHub Actions

Implemented an automated Continuous Integration pipeline using GitHub Actions to validate code quality, dependencies, tests, and builds on pushes and pull requests to `main`.

### Key Features
- **Workflow Automation**: Configured `.github/workflows/ci.yml` running decoupled, parallel `frontend-ci` and `backend-ci` jobs.
- **Frontend Quality Gate**: Installs dependencies with `npm ci`, enforces code standards via ESLint (`npm run lint`), and verifies production Vite compilation (`npm run build`).
- **Backend Quality Gate**: Executes pure database-independent unit tests (`npm run test:unit`) in <150ms and runs full integration tests (`npm test`) against an automated `mongo:7.0` container service.
- **Reproducible Pipeline**: Strict usage of `npm ci` leveraging `package-lock.json` lockfiles and Node.js 20 LTS caching (`actions/setup-node@v4`).
- **Failure & Success Verified**: Demonstrated that a deliberate assertion failure causes the pipeline to exit with code 1 (failing), and restoring valid assertions returns exit code 0 (passing).
- **Least-Privilege Security**: Set `permissions: contents: read` with zero committed secrets, passwords, or tokens.
- **Detailed Documentation**: See [docs/practical-12-ci-cd.md](docs/practical-12-ci-cd.md) for CI vs. CD concepts, pipeline breakdown, and demonstration procedures.



