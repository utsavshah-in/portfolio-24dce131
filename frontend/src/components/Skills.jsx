const skillList = ['HTML5', 'CSS3', 'JavaScript', 'React', 'React Router', 'Responsive UI', 'Git & GitHub', 'Vite'];
export default function Skills() {
  return <section className="content-section" id="skills"><div className="section-heading"><div><div className="eyebrow">02 / Toolkit</div><h2>Tools I work with.</h2></div><p>The current toolkit I use to build frontend projects.</p></div><div className="skills-list">{skillList.map(skill => <span className="skill-pill" key={skill}>{skill}</span>)}</div></section>;
}
