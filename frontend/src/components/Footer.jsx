export default function Footer() {
  return <footer className="site-footer"><span>© {new Date().getFullYear()} Utsav. Built with React.</span><a href="#root" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a></footer>;
}
