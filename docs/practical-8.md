# Practical 8 — Server-Side Caching and Performance Measurement

## Objective

The objective of Practical 8 is to introduce server-side in-memory caching to the Task Management API using `node-cache`. This optimizes database round-trips to MongoDB, enhances API response times, implements automated cache invalidation on write operations, preserves JWT user isolation, and provides cache observability and performance benchmarking.

---

## 1. What is In-Memory Caching?

In-memory caching is the practice of storing frequently accessed data directly in volatile system memory (RAM) rather than retrieving it from persistent storage (such as MongoDB on disk or over a network cluster) on every request.

### `node-cache` Process-Local Memory
- `node-cache` stores cached key-value pairs inside the **heap memory of the Node.js process**.
- **Fast retrieval**: Fetching an object from RAM occurs in sub-millisecond time, avoiding network sockets, TLS negotiation, and MongoDB query execution.
- **Process-local limitation**: Because `node-cache` is in-process memory:
  - Cache entries **disappear when the backend server restarts**.
  - Cache entries **are not shared** across multiple backend instances or clustering workers (for distributed/clustered systems, a distributed cache like Redis or Memcached would be used).

---

## 2. Cache Hit vs. Cache Miss

When a client sends `GET /tasks`:

| Scenario | Condition | Action Taken | Latency | Response Header |
|---|---|---|---|---|
| **Cache Miss** | The requested key does not exist in `node-cache` (first request or after invalidation/TTL expiry). | The server queries MongoDB (`Task.find(...)`), saves the returned task list in cache under `tasks:user:<userId>`, and returns the result. | Higher (network & DB trip) | `X-Cache: MISS` |
| **Cache Hit** | The requested key already exists in `node-cache`. | The server retrieves the data directly from RAM and returns it immediately without contacting MongoDB. | Very low (<5ms in local process) | `X-Cache: HIT` |
| **Cache Bypass** | Caching is disabled via `CACHE_ENABLED=false`. | The cache is ignored completely, and MongoDB is queried on every request. | Standard DB latency | `X-Cache: BYPASS` |

---

## 3. TTL (Time-To-Live) Strategy

- **Default TTL (`stdTTL`)**: Configured to **60 seconds**.
- **Check Period (`checkperiod`)**: Configured to **120 seconds**.

### Why 60 Seconds?
- **Balance between freshness and performance**: A 60-second TTL ensures that frequently queried task lists are served from RAM, drastically reducing read load on MongoDB.
- **Fail-safe expiration**: Even if an unexpected out-of-band database update occurs, stale data will persist for at most 60 seconds before automatically expiring and being re-fetched from the database.

---

## 4. Cache Invalidation Strategy

To prevent serving stale data, the cache employs an **event-driven write-through invalidation strategy**:

1. **Only invalidate after successful DB writes**: Cache entries are deleted only after MongoDB successfully writes the change. If the database rejects a write or validation fails, cache entries are not disturbed.
2. **Operations that trigger invalidation**:
   - `POST /tasks` (Task creation): Invalidates the user's task cache key `tasks:user:<userId>`.
   - `PUT /tasks/:id` (Task update): Invalidates the user's task cache key `tasks:user:<userId>`.
   - `DELETE /tasks/:id` (Task deletion): Invalidates the user's task cache key `tasks:user:<userId>`.
3. **User Isolation**:
   - Cache keys are namespaced per user: `tasks:user:${userId}`.
   - When User A modifies their tasks, only User A's cache is invalidated.
   - User B's cache is completely unaffected.
   - User B can never read or overwrite User A's cached tasks.

---

## 5. API Endpoints

All task and cache endpoints require JWT authentication from Practical 7 via `Authorization: Bearer <token>`.

| Method | Endpoint | Protection | Description | Cache Behavior |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account | None |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT token | None |
| `GET` | `/api/auth/me` | JWT | Get current user profile | None |
| `GET` | `/tasks` | JWT | Get tasks of authenticated user | Serves from cache on HIT; queries DB and populates cache on MISS; bypasses when disabled |
| `GET` | `/tasks/:id` | JWT | Get single task by ID | Queries DB (ownership verified) |
| `POST` | `/tasks` | JWT | Create a new task | Writes to DB; **invalidates** `tasks:user:<id>` |
| `PUT` | `/tasks/:id` | JWT | Update task | Writes to DB; **invalidates** `tasks:user:<id>` |
| `DELETE` | `/tasks/:id` | JWT | Delete task | Deletes from DB; **invalidates** `tasks:user:<id>` |
| `GET` | `/api/cache/stats` | JWT | Inspect cache stats (hits, misses, invalidations) | Returns stats JSON without exposing sensitive data |
| `POST` | `/api/cache/clear` | JWT | Manually flush cache | Flushes all entries from memory |

---

## 6. How to Configure and Run

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (`backend/.env`)
Ensure your `backend/.env` file has the required values:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
CACHE_ENABLED=true
```

### 3. Start the Backend
- Standard mode (caching enabled by default):
  ```bash
  npm start
  ```
- Or with file-watching in development:
  ```bash
  npm run dev
  ```

---

## 7. How to Toggle Caching for Benchmarking

You can enable or disable caching using the `CACHE_ENABLED` environment variable without code changes:

### In PowerShell (Windows):
- **Run with caching DISABLED**:
  ```powershell
  $env:CACHE_ENABLED="false"; node server.js
  ```
- **Run with caching ENABLED**:
  ```powershell
  $env:CACHE_ENABLED="true"; node server.js
  ```

### In Git Bash or Linux/macOS:
- **Run with caching DISABLED**:
  ```bash
  CACHE_ENABLED=false node server.js
  ```
- **Run with caching ENABLED**:
  ```bash
  CACHE_ENABLED=true node server.js
  ```

Alternatively, change `CACHE_ENABLED=false` or `CACHE_ENABLED=true` in `backend/.env` and restart the backend.

---

## 8. Measuring Performance (Postman / Thunder Client)

### Step 1: Register and Log In
1. Send `POST /api/auth/register` or `POST /api/auth/login` with:
   ```json
   {
     "email": "student@example.com",
     "password": "Password123"
   }
   ```
2. Copy the `token` from the response.

### Step 2: Configure Header
In Postman or Thunder Client, set the Authorization header for all subsequent requests:
```http
Authorization: Bearer <your_copied_token>
```

### Step 3: Measure with Caching Disabled
1. Start backend with `CACHE_ENABLED=false`.
2. Send `GET http://localhost:5000/tasks` 3 times.
3. Observe the response header `X-Cache: BYPASS`.
4. Note the response time in milliseconds displayed in the Postman/Thunder Client status bar.

### Step 4: Measure with Caching Enabled
1. Restart backend with `CACHE_ENABLED=true`.
2. Send `GET http://localhost:5000/tasks` (First request will be `X-Cache: MISS`).
3. Send `GET http://localhost:5000/tasks` 3 times (Subsequent requests will be `X-Cache: HIT`).
4. Note the response time in milliseconds for each repeated HIT.

### Step 5: Check Cache Observability
Send `GET http://localhost:5000/api/cache/stats` with your token to see live server-side statistics:
```json
{
  "cachingEnabled": true,
  "defaultTTL": 60,
  "checkperiod": 120,
  "stats": {
    "hits": 3,
    "misses": 1,
    "invalidations": 0,
    "keysCount": 1
  },
  "keys": [
    "tasks:user:67123..."
  ]
}
```

---

## 9. Performance Comparison Table

Measure these values manually using Postman, Thunder Client, or curl against your live running server:

| Condition | Reading 1 (ms) | Reading 2 (ms) | Reading 3 (ms) | Average (ms) |
|---|---:|---:|---:|---:|
| Caching disabled (`CACHE_ENABLED=false`) | — | — | — | — |
| Caching enabled (`CACHE_ENABLED=true`, HIT) | — | — | — | — |

*(Fill in the table above after taking your own measurements).*

---

## 10. Automated Tests

The implementation includes an automated test suite located at `backend/test/cache.test.js` using Node.js's built-in test runner (`node:test`).

### Run the Automated Tests:
```bash
cd backend
npm test
```

### Verified Test Cases:
1. **Cache Miss**: First `GET /tasks` request queries database and returns `X-Cache: MISS`.
2. **Cache Hit**: Repeated `GET /tasks` request returns cached data from RAM with `X-Cache: HIT`.
3. **Data Parity**: The cached response matches the database response structure and content identically.
4. **POST Invalidation**: Creating a task invalidates the user's cache; subsequent `GET` is a `MISS`.
5. **PUT Invalidation**: Updating a task invalidates the user's cache; subsequent `GET` is a `MISS`.
6. **DELETE Invalidation**: Deleting a task invalidates the user's cache; subsequent `GET` is a `MISS`.
7. **User Isolation**: Requests by User A and User B use distinct cache keys; neither user receives the other's cached data.
8. **Authentication Preservation**: Protected routes reject missing or invalid JWT tokens with `401 Unauthorized`.
9. **Error Handling**: Invalid object IDs (`400`) and missing required fields (`400`) are handled correctly.
10. **Cache Bypass**: Setting `CACHE_ENABLED=false` bypasses the cache and returns `X-Cache: BYPASS`.
11. **Observability**: `GET /api/cache/stats` returns accurate counts without leaking secrets.
