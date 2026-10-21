import { Link } from 'react-router-dom';
import Footer from './Footer';
export default function NotFound() {
  return <><main className="not-found"><div className="eyebrow">Error / 404</div><h1>404</h1><h2>Page not found.</h2><p style={{ color: 'var(--muted)' }}>The page you’re looking for doesn’t exist or has moved.</p><Link className="button button-primary" to="/">Return home</Link></main><Footer /></>;
}
