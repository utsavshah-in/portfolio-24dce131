import Header from "../components/Header";
import About from "../components/About";
import Skills from "../components/Skills";
import Footer from "../components/Footer";

function Home() {

    const skills = [
        "HTML",
        "CSS",
        "JavaScript",
        "React"
    ];

    return (
        <div>

            <Header
                title="Student Portfolio"
                name="Utsav Shah"
            />

            <About />

            <Skills skills={skills} />

            <Footer
                email="utsav@email.com"
            />

        </div>
    );
}

export default Home;