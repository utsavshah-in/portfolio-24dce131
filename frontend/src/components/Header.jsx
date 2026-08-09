function Header({ name, themeColor }) {
  return (
    <header style={{ backgroundColor: themeColor }}>
      <h1>{name}</h1>
      <p>Student Portfolio</p>
    </header>
  );
}

export default Header;