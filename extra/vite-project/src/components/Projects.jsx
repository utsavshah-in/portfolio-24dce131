function Projects() {

    const projects = [

        "Portfolio Website",

        "Student Management System",

        "Weather App"

    ];

    return (

        <section>

            <h2>Projects</h2>

            <ul>

                {projects.map((project, index) => (

                    <li key={index}>{project}</li>

                ))}

            </ul>

        </section>

    );

}

export default Projects;