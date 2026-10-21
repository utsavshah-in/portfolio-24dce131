import { lazy, Suspense, useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';

// Lazy-loaded heavy component (Practical 9: component-level lazy loading)
const ProjectAnalytics = lazy(() => import('./ProjectAnalytics'));

const GITHUB_USERNAME = 'utsavshah-in';

export default function Projects({ preview = false }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRepositories() {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'GitHub username was not found. Check GITHUB_USERNAME in Projects.jsx.'
              : `GitHub API request failed (${response.status}). Please try again later.`
          );
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Unexpected response received from GitHub.');
        }

        if (!cancelled) setRepos(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load repositories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRepositories();
    return () => { cancelled = true; };
  }, []);

  const displayedRepos = preview ? repos.slice(0, 3) : repos;

  return (
    <>
      {!preview && <Header name="Projects" />}
      <section className="content-section" id="projects">
        <div className="section-heading">
          <div>
            <div className="eyebrow">03 / GitHub repositories</div>
            <h2>{preview ? 'Recent work.' : 'Projects and repositories.'}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <p>Live public repositories fetched from GitHub using the Fetch API, useEffect, and React state.</p>
            {!preview && !loading && !error && repos.length > 0 && (
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowAnalytics((v) => !v)}
                style={{ cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {showAnalytics ? 'Hide Repository Analytics ↑' : 'Explore Repository Analytics (Lazy-loaded) ↗'}
              </button>
            )}
          </div>
        </div>

        {showAnalytics && !preview && (
          <Suspense
            fallback={
              <div
                className="project-card"
                role="status"
                aria-live="polite"
                style={{ marginTop: 20, marginBottom: 24, textAlign: 'center', padding: '36px 20px' }}
              >
                <div className="portfolio-spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Loading repository analytics module…</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  Code-split chunk loaded on demand
                </p>
              </div>
            }
          >
            <ProjectAnalytics repos={repos} />
          </Suspense>
        )}

        {loading && (
          <div className="project-card" role="status" aria-live="polite">
            <p>Loading GitHub repositories…</p>
          </div>
        )}

        {!loading && error && (
          <div className="project-card" role="alert">
            <h3>Could not load repositories</h3>
            <p>{error}</p>
            <button className="button button-secondary" type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && repos.length === 0 && (
          <div className="project-card">
            <p>No public repositories were found for this account.</p>
          </div>
        )}

        {!loading && !error && displayedRepos.length > 0 && (
          <div className="projects-grid">
            {displayedRepos.map((repo, index) => (
              <article className="project-card" key={repo.id}>
                <span className="project-number">REPOSITORY_{String(index + 1).padStart(2, '0')}</span>
                <h3>{repo.name}</h3>
                <p>{repo.description || 'No description has been added to this repository yet.'}</p>
                <div className="project-tags">
                  {repo.language && <span className="project-tag">{repo.language}</span>}
                  <span className="project-tag">★ {repo.stargazers_count}</span>
                  {repo.fork && <span className="project-tag">Fork</span>}
                </div>
                <a className="project-link" href={repo.html_url} target="_blank" rel="noreferrer">
                  View repository ↗
                </a>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && preview && repos.length > 3 && (
          <p style={{ marginTop: 24 }}>
            <a className="project-link" href="/projects">View all repositories ↗</a>
          </p>
        )}
      </section>
      {!preview && <Footer />}
    </>
  );
}
