import "./App.css";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Projects from "./components/Projects";
import NotFound from "./pages/NotFound";

import { Routes, Route } from "react-router-dom";

function App() {

    return (

        <div>

            <Navbar />

            <Routes>

                <Route path="/" element={<Home />} />

                <Route path="/projects" element={<Projects />} />

                <Route path="/contact" element={<Contact />} />

                <Route path="*" element={<NotFound />} />

            </Routes>

        </div>

    );

}

export default App;