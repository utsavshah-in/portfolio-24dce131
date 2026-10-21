import { useMemo, useState } from 'react';

export default function ProjectAnalytics({ repos = [] }) {
  const [filterLang, setFilterLang] = useState('ALL');

  // Compute language distribution and repository statistics
  const stats = useMemo(() => {
    const langCounts = {};
    let totalStars = 0;
    let totalForks = 0;

    repos.forEach((repo) => {
      const lang = repo.language || 'Other';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
      totalStars += repo.stargazers_count || 0;
      if (repo.fork) totalForks += 1;
    });

    const totalCount = repos.length || 1;
    const languages = Object.entries(langCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      languages,
      totalStars,
      totalForks,
      totalRepos: repos.length,
      primaryLanguage: languages[0]?.name || 'N/A',
    };
  }, [repos]);

  const filteredRepos = useMemo(() => {
    if (filterLang === 'ALL') return repos;
    return repos.filter((r) => (r.language || 'Other') === filterLang);
  }, [repos, filterLang]);

  return (
    <div className="analytics-card project-card" style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="project-number">LAZY_LOADED_ANALYTICS_MODULE</span>
          <h3 style={{ margin: '4px 0 8px', fontSize: '1.4rem' }}>Repository & Tech Stack Analytics</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Heavy data-visualization chunk dynamically loaded via <code>React.lazy()</code> on user interaction.
          </p>
        </div>
        <span className="project-tag" style={{ background: 'var(--violet-strong)', color: '#fff', fontWeight: 600 }}>
          Code-split Chunk
        </span>
      </div>

      {/* Summary KPI Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, margin: '20px 0' }}>
        <div style={{ padding: '14px', borderRadius: 10, background: 'var(--panel-soft)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Repositories</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{stats.totalRepos}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: 10, background: 'var(--panel-soft)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Total Stars</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--violet)', marginTop: 4 }}>★ {stats.totalStars}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: 10, background: 'var(--panel-soft)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Forks</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{stats.totalForks}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: 10, background: 'var(--panel-soft)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Primary Stack</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stats.primaryLanguage}
          </div>
        </div>
      </div>

      {/* Language Percentage Bar */}
      <div style={{ margin: '24px 0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 600 }}>Language Distribution</span>
          <span style={{ color: 'var(--muted)' }}>{stats.languages.length} technologies identified</span>
        </div>
        <div
          role="progressbar"
          aria-label="Language distribution"
          style={{
            display: 'flex',
            height: 12,
            borderRadius: 6,
            overflow: 'hidden',
            background: 'var(--border)',
            gap: 2,
          }}
        >
          {stats.languages.map((lang, index) => {
            const hues = [260, 280, 200, 160, 45, 340];
            const bg = `hsl(${hues[index % hues.length]}, 70%, 55%)`;
            return (
              <div
                key={lang.name}
                style={{
                  width: `${lang.percentage}%`,
                  background: bg,
                  transition: 'width 0.4s ease',
                }}
                title={`${lang.name}: ${lang.percentage}% (${lang.count} repos)`}
              />
            );
          })}
        </div>
      </div>

      {/* Interactive Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 20px' }}>
        <button
          type="button"
          onClick={() => setFilterLang('ALL')}
          className={`skill-pill ${filterLang === 'ALL' ? 'active-filter' : ''}`}
          style={{
            cursor: 'pointer',
            borderColor: filterLang === 'ALL' ? 'var(--violet)' : 'var(--border)',
            background: filterLang === 'ALL' ? 'var(--violet)' : 'transparent',
            color: filterLang === 'ALL' ? '#100c1c' : 'var(--text)',
            fontWeight: 600,
          }}
        >
          All ({repos.length})
        </button>
        {stats.languages.map((lang) => (
          <button
            key={lang.name}
            type="button"
            onClick={() => setFilterLang(lang.name)}
            className={`skill-pill ${filterLang === lang.name ? 'active-filter' : ''}`}
            style={{
              cursor: 'pointer',
              borderColor: filterLang === lang.name ? 'var(--violet)' : 'var(--border)',
              background: filterLang === lang.name ? 'var(--violet)' : 'transparent',
              color: filterLang === lang.name ? '#100c1c' : 'var(--text)',
              fontWeight: 600,
            }}
          >
            {lang.name} ({lang.count} · {lang.percentage}%)
          </button>
        ))}
      </div>

      {/* Filtered Repo Mini Table */}
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '8px 10px' }}>Repository</th>
              <th style={{ padding: '8px 10px' }}>Language</th>
              <th style={{ padding: '8px 10px' }}>Stars</th>
              <th style={{ padding: '8px 10px' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredRepos.map((repo) => (
              <tr key={repo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                  <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ color: 'var(--violet)', textDecoration: 'none' }}>
                    {repo.name} ↗
                  </a>
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>{repo.language || 'Plain text'}</td>
                <td style={{ padding: '8px 10px' }}>★ {repo.stargazers_count}</td>
                <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>{repo.fork ? 'Fork' : 'Source'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
