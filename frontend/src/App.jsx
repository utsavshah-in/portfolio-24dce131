import { lazy, Suspense, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import LoadingFallback from './components/LoadingFallback';
import NotFound from './components/NotFound';
import './App.css';

// Route-based code splitting using React.lazy() (Practical 9)
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
const TaskManager = lazy(() => import('./components/TaskManager'));

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={`app-shell ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <nav className="site-nav" aria-label="Main navigation">
        <NavLink className="brand" to="/" end>utsav<span>.dev</span></NavLink>
        <div className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/tasks">Tasks</NavLink>
          <NavLink className="nav-contact" to="/contact">Contact ↗</NavLink>
        </div>
      </nav>

      {/* Suspense boundary wrapping route area with accessible dark/violet loading fallback */}
      <Suspense fallback={<LoadingFallback message="Loading page component…" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <div className="floating-controls">
        <button type="button" className="small-control" onClick={() => setDarkMode(value => !value)}>
          {darkMode ? 'Switch to light' : 'Switch to dark'}
        </button>
        <button type="button" className="small-control" onClick={() => setShowHelp(value => !value)}>
          {showHelp ? 'Hide help' : 'Help'}
        </button>
      </div>
      {showHelp && (
        <aside className="help-panel" role="status">
          <strong>Quick help</strong>
          <p>Use the navigation links to visit each page. On Contact, type a message to see the character count update live. Projects and Tasks load on demand.</p>
          <button type="button" className="text-button" onClick={() => setShowHelp(false)}>Close</button>
        </aside>
      )}
    </div>
  );
}
