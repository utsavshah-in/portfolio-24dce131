import Header from "./Header";
import About from "./About";
import Skills from "./Skills";

function Home() {
  const skills = [
    "C++",
    "Java",
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB",
  ];

  return (
    <>
      <Header
        name="Utsav Shah"
        themeColor="#1f2937"
      />

      <main>
        <About
          description="I am a Computer Engineering student interested in software development, web technologies, and problem solving."
        />

        <Skills skillList={skills} />
      </main>
    </>
  );
}

export default Home;