function Projects() {
  const projects = [
    "SpndX - Personal Finance and Analytics Platform",
    "Student Portfolio Website",
    "Data Structures and Algorithms Visualizer",
  ];

  return (
    <section>
      <h2>Projects</h2>

      <ul>
        {projects.map((project) => (
          <li key={project}>{project}</li>
        ))}
      </ul>
    </section>
  );
}

export default Projects;