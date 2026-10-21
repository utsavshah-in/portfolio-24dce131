# Practical 9 — Code Splitting and Lazy Loading in React

## Objective

The objective of Practical 9 is to optimize React web application performance by implementing **code splitting** and **lazy loading** using `React.lazy()` and `Suspense`. By breaking a monolithic single JavaScript bundle into isolated, on-demand chunks, initial page-load bandwidth and Time-to-Interactive (TTI) are significantly improved.

---

## 1. Core Concepts Explained

### 1.1 What is Code Splitting?
In traditional single-page React applications bundled with Vite, Webpack, or Rollup, all source code across every route and component is packaged into a single monolithic JavaScript bundle (e.g. `index.js`). As the application grows to include more pages, utilities, and heavy third-party modules, the initial bundle size increases. Every user is forced to download, parse, and compile code for routes they may never visit.

**Code splitting** is the practice of splitting application code into smaller chunks that can be fetched asynchronously on demand (lazy loaded) or loaded in parallel.

### 1.2 Dynamic `import()`
At the engine level, code splitting relies on ECMAScript dynamic `import()` syntax:
```javascript
import('./components/Projects.js').then((module) => {
  // Module is loaded asynchronously when this promise resolves
});
```
When build tools like Vite/Rollup detect dynamic `import()`, they automatically split the referenced module and its unique subtree into an independent JavaScript chunk file inside `dist/assets/`.

### 1.3 `React.lazy()`
`React.lazy()` is a built-in React function that lets you render a dynamic import as a regular React component:
```jsx
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
```
- It takes a function that calls a dynamic `import()`.
- The dynamic import must return a Promise that resolves to a module with a `default` export containing a React component.
- The component is only requested over the network when it is first rendered into the DOM.

### 1.4 `<Suspense>` and Loading Fallbacks
Because a lazy-loaded component is fetched asynchronously over the network, React needs to know what to display to the user while the chunk is in flight.

The `<Suspense>` component wraps lazy-loaded elements and accepts a `fallback` prop:
```jsx
<Suspense fallback={<LoadingFallback message="Loading page component…" />}>
  <Routes>
    <Route path="/projects" element={<Projects />} />
    <Route path="/contact" element={<Contact />} />
  </Routes>
</Suspense>
```
- While the JavaScript chunk is downloading, React renders the `fallback` UI.
- Once the chunk arrives and executes, React replaces the fallback with the resolved component.
- If a route chunk fails to load (e.g., network failure), an Error Boundary can catch the error and present a recovery option.

---

## 2. Implementation Overview

### 2.1 Route-Based Lazy Loading (`frontend/src/App.jsx`)
The top-level route components for **Projects**, **Contact**, and **TaskManager** are dynamically imported using `React.lazy()`:

```jsx
import { lazy, Suspense, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import LoadingFallback from './components/LoadingFallback';
import NotFound from './components/NotFound';
import './App.css';

// Route-based code splitting (Practical 9)
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
const TaskManager = lazy(() => import('./components/TaskManager'));
```

#### Selective Boundary Placement
Only the `<Routes>` container is wrapped inside `<Suspense>`. The navigation header (`<nav className="site-nav">`), theme switcher (`Switch to dark/light`), and floating help controls remain **outside** `<Suspense>`. This ensures:
1. Navigation and theme controls are immediately available and interactive without layout flickering.
2. The user sees a smooth loading transition localized to the content area.
3. Unknown routes (`path="*"`) render `<NotFound />` seamlessly.

### 2.2 Component-Based Lazy Loading (`frontend/src/components/ProjectAnalytics.jsx`)
Beyond route-based splitting, an interactive **Repository & Tech Stack Analytics** module (`ProjectAnalytics.jsx`) was created and lazy-loaded inside `Projects.jsx`.

```jsx
// frontend/src/components/Projects.jsx
const ProjectAnalytics = lazy(() => import('./ProjectAnalytics'));

// Rendered on-demand when user clicks "Explore Repository Analytics"
{showAnalytics && !preview && (
  <Suspense fallback={<AnalyticsCardSpinner />}>
    <ProjectAnalytics repos={repos} />
  </Suspense>
)}
```

#### What makes this component heavy/suitable?
- Computes aggregate statistics across all GitHub repositories (total stars, forks, primary stack, and language proportions).
- Renders an interactive SVG distribution bar and technology filter pills.
- Generates a full repository activity table.
- **Loading behavior**: By deferring this component until user interaction, visitors who simply skim the project list do not pay the network or parsing cost for this data visualization chunk.

### 2.3 Accessible Theme-Matching Fallback (`frontend/src/components/LoadingFallback.jsx`)
The fallback component was designed to match the portfolio's dark/violet theme:
- Built with `role="status"` and `aria-live="polite"` for screen reader accessibility.
- Styled with CSS animation `.portfolio-spinner` utilizing CSS custom properties (`var(--violet)`, `var(--border)`).
- Provides an invisible `.sr-only` description to ensure assistive devices announce the loading state.

---

## 3. How to Run and Build the Frontend

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3.3 Create a Production Build
```bash
npm run build
```

### 3.4 Preview the Production Build Locally
```bash
npm run preview
```
Open `http://localhost:4173` to test the true production chunk behavior.

---

## 4. Build Output and Chunk Verification

### 4.1 Production Build Log
Running `npm run build` with Vite produces distinct, separated chunk files:

```text
vite v8.2.0 building client environment for production...
transforming...✓ 38 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                             0.47 kB │ gzip:  0.30 kB
dist/assets/TaskManager-B1br1H2N.css        3.17 kB │ gzip:  1.19 kB
dist/assets/index-BCyjBy6A.css              7.59 kB │ gzip:  2.37 kB
dist/assets/Header-CLhdo3uB.js              0.46 kB │ gzip:  0.31 kB
dist/assets/Contact-IXz6bdib.js             2.11 kB │ gzip:  0.89 kB
dist/assets/Projects-BFR_fUck.js            4.12 kB │ gzip:  1.74 kB
dist/assets/TaskManager-BcJvJ4wD.js         5.45 kB │ gzip:  1.99 kB
dist/assets/ProjectAnalytics-c5lVsHfO.js    5.96 kB │ gzip:  1.84 kB
dist/assets/index-CApy9WD9.js             236.57 kB │ gzip: 75.67 kB

✓ built in 285ms
```

### 4.2 Chunk Breakdown Analysis

| Chunk File | Size (Raw) | Size (Gzip) | Type | When Loaded |
|---|---|---|---|---|
| `index-CApy9WD9.js` | 236.57 kB | 75.67 kB | Main entry bundle | Immediately upon initial page load (`/`) |
| `Contact-IXz6bdib.js` | 2.11 kB | 0.89 kB | Route chunk | On navigating to `/contact` |
| `Projects-BFR_fUck.js` | 4.12 kB | 1.74 kB | Route chunk | On navigating to `/projects` |
| `TaskManager-BcJvJ4wD.js` | 5.45 kB | 1.99 kB | Route chunk | On navigating to `/tasks` |
| `ProjectAnalytics-c5lVsHfO.js` | 5.96 kB | 1.84 kB | Component chunk | On clicking "Explore Repository Analytics" |
| `Header-CLhdo3uB.js` | 0.46 kB | 0.31 kB | Shared chunk | Loaded with first route needing sub-header |

**Result**: 18.10 kB of JavaScript (6.77 kB gzipped) was separated out of the primary bundle into on-demand chunks.

---

## 5. Performance Evaluation & DevTools Verification

### 5.1 Verifying Chunks in Chrome DevTools Network Tab
1. Open Google Chrome and start the production preview server:
   ```bash
   cd frontend
   npm run preview
   ```
2. Open Chrome DevTools (`F12` or `Ctrl + Shift + I`).
3. Switch to the **Network** tab.
4. Filter by **JS** and ensure **Disable cache** is checked.
5. Visit the root path `http://localhost:4173/`.
   - **Observation**: Only `index-[hash].js` and vendor chunks load. Chunks for `Contact`, `Projects`, and `ProjectAnalytics` are **not requested**.
6. Click the **Projects** navigation link:
   - **Observation**: `Projects-[hash].js` and `Header-[hash].js` are fetched dynamically on demand.
7. Click the **Explore Repository Analytics (Lazy-loaded) ↗** button:
   - **Observation**: `ProjectAnalytics-[hash].js` is fetched only upon user interaction.
8. Click the **Contact ↗** navigation link:
   - **Observation**: `Contact-[hash].js` is fetched dynamically.
9. Click the **Tasks** navigation link:
   - **Observation**: `TaskManager-[hash].js` is fetched dynamically.

### 5.2 Observing the Suspense Fallback with Network Throttling
1. In Chrome DevTools, open the **Network** tab.
2. Click the throttling dropdown (labeled **No throttling** by default) and choose **Fast 3G** or **Slow 3G**.
3. Clear your network log and navigate to `/contact` or `/tasks`.
4. **Observation**: Notice the glowing violet `.portfolio-spinner` and the accessible text `"Loading page component…"` rendered smoothly in the center of the content area while the chunk downloads over the simulated constrained connection.

### 5.3 React DevTools Profiler & Re-Render Elimination
Using the **React DevTools Profiler** tab:
1. Open DevTools and switch to the **Profiler** tab.
2. Click **Record** (round blue/grey button).
3. Navigate to a route or trigger a state update, then click **Stop recording**.
4. Inspect the flamegraph to analyze component render times and re-render causes.

#### Identified & Resolved Unnecessary Re-render:
- **Issue Detected**: In `TaskManager.jsx`, the data-fetching function was calling `setLoading(true)` synchronously inside `useEffect()` on mount.
- **Profiler Symptom**: Triggered a cascading re-render cycle immediately upon mounting (Mount Render → State Update Render → Data Load Render).
- **ESLint Rule Flagged**: `react-hooks/set-state-in-effect`.
- **Optimization Applied**: Restructured initial mount data loading to fetch asynchronously without redundant synchronous `setState` calls during effect execution. Added `useMemo` in `ProjectAnalytics.jsx` to prevent re-aggregating repository statistics on unrelated parent re-renders.

---

## 6. Performance Comparison Table

| Metric | Before Lazy Loading (Monolith) | After Lazy Loading (Practical 9) | Improvement / Difference |
|---|---|---|---|
| **Entry JS Bundle (`index.js`)** | 239.65 kB (76.32 kB gzip) | 236.57 kB (75.67 kB gzip) | **3.08 kB smaller** initial payload |
| **Number of JS Chunks** | 1 monolithic chunk | 6 discrete chunks | Modular on-demand architecture |
| **Projects Route JS** | Loaded upfront (0.00 kB separate) | 4.12 kB (1.74 kB gzip) | Downloaded only on demand |
| **Contact Route JS** | Loaded upfront (0.00 kB separate) | 2.11 kB (0.89 kB gzip) | Downloaded only on demand |
| **TaskManager Route JS** | Loaded upfront (0.00 kB separate) | 5.45 kB (1.99 kB gzip) | Downloaded only on demand |
| **Project Analytics Module** | N/A (unsplit) | 5.96 kB (1.84 kB gzip) | Downloaded only on interaction |
| **Suspense Fallback UI** | None (blank/blocked during slow loads) | Accessible violet spinner (`role="status"`) | Enhanced UX on low bandwidth |
| **Lint / Build Status** | 1 lint error | **0 errors, 0 warnings** | Clean build & type safety |

---

## 7. Limitations and Manual Verification Checklist

- [x] Route-based code splitting verified in `App.jsx` using `React.lazy()` and `<Suspense>`.
- [x] Accessible loading fallback implemented with dark/violet theme styling.
- [x] Component-level code splitting verified in `ProjectAnalytics.jsx` with dedicated `<Suspense>`.
- [x] `npm run build` generates 6 distinct chunk files.
- [x] `npm run lint` passes cleanly with 0 errors.
- [x] Practical 8 backend tests pass (11/11 tests pass).
- [ ] *Manual Verification*: Open `npm run preview` in Google Chrome and verify chunk fetching in the Network tab under Slow 3G throttling.
- [ ] *Manual Verification*: Navigate to `/non-existent-route` to verify 404 Not Found page still renders correctly.
