export default function Header({ name = 'Utsav', themeColor = '#a78bfa' }) {
  return <header className="page-hero"><div className="eyebrow">Portfolio / {name}</div><h1>My work, <span style={{ color: themeColor }}>in progress.</span></h1><p>A selection of things I’ve built while learning, experimenting, and improving my craft.</p></header>;
}
