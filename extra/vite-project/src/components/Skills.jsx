function Skills(props) {

    return (

        <section>

            <h2>Skills</h2>

            <ul>

                {props.skills.map((skill, index) => (

                    <li key={index}>{skill}</li>

                ))}

            </ul>

        </section>

    );

}

export default Skills;