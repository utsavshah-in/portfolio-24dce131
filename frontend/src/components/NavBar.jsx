import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav className="navbar">
      <h2>Utsav Shah</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </nav>
  );
}

export default NavBar;