import { useEffect, useMemo, useState } from "react";

function Projects() {
  const username = "utsavshah-in";

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRepos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message || "Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return repos;
    return repos.filter((repo) =>
      repo.name.toLowerCase().includes(query)
    );
  }, [repos, search]);

  if (loading) {
    return (
      <main>
        <section>
          <h2>Projects</h2>
          <p>Loading repositories...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <section>
          <h2>Projects</h2>
          <p>{error}</p>
          <button onClick={fetchRepos}>Retry</button>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section>
        <h2>Projects</h2>

        <input
          type="text"
          placeholder="Search repositories by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <p>Total repositories: {filteredRepos.length}</p>

        <ul>
          {filteredRepos.map((repo) => (
            <li key={repo.id}>
              <a href={repo.html_url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>{" "}
              — ⭐ {repo.stargazers_count}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Projects;