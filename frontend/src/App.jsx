import "./App.css";

import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Footer from "./components/Footer";


function App() {
  const skills = [
    "C++",
    "Java",
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB",
  ];

  return (
    <div>
      <Header
        name="Utsav Shah"
        themeColor="#1f2937"
      />

      <main>
        <About
          description="I am a Computer Engineering student interested in software development, web technologies, and problem solving."
        />

        <Skills skillList={skills} />

        <Projects />
      </main>

      <Footer email="utsav@example.com" />
    </div>
  );
}

export default App;