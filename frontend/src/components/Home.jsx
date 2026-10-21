import { lazy, Suspense } from 'react';
import About from './About';
import Skills from './Skills';
import Footer from './Footer';

const Projects = lazy(() => import('./Projects'));

export default function Home() {
  return (
    <>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">Computer science student · Web developer</div>
            <h1>Building for the web.<br /><span>Learning by doing.</span></h1>
            <p className="hero-copy">I’m Utsav — a developer focused on creating clean, useful digital experiences and turning ideas into working projects.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/projects">Explore projects ↗</a>
              <a className="button" href="/contact">Get in touch</a>
            </div>
          </div>
          <div className="hero-art" aria-label="Decorative code illustration">
            <div className="orbit" /><div className="orbit orbit-two" />
            <div className="code-card">
              <div className="code-top"><i className="code-dot" /><i className="code-dot" /><i className="code-dot" /></div>
              <div className="code-line"><span className="purple">const</span> developer = {'{'}</div>
              <div className="code-line indent">name: <span className="green">'Utsav'</span>,</div>
              <div className="code-line indent">focus: <span className="green">'Web development'</span>,</div>
              <div className="code-line indent">curiosity: <span className="purple">true</span>,</div>
              <div className="code-line">{'}'};</div>
              <div className="code-line" style={{ marginTop: 12 }}><span className="purple">while</span> (learning) {'{'}</div>
              <div className="code-line indent">buildSomething();</div><div className="code-line">{'}'}</div>
            </div>
          </div>
        </section>
        <About />
        <Skills />
        <Suspense
          fallback={
            <div className="content-section" style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="portfolio-spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--muted)', margin: 0 }}>Loading projects preview…</p>
            </div>
          }
        >
          <Projects preview />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
