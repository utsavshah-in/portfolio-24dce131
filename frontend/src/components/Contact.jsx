import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return <><Header name="Contact" /><section className="content-section"><div className="contact-layout"><article className="contact-card"><div className="eyebrow">Let’s connect</div><h2 style={{ fontSize: '2rem', letterSpacing: '-.05em' }}>Have an idea?</h2><p>This demonstration form shows React controlled inputs and state updates. It does not send data to a server.</p><div className="contact-links"><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></article><article className="contact-card"><form className="contact-form" onSubmit={handleSubmit}><label>Name<input name="name" value={name} onChange={event => { setName(event.target.value); setSubmitted(false); }} placeholder="Your name" required /></label><label>Email<input name="email" type="email" value={email} onChange={event => { setEmail(event.target.value); setSubmitted(false); }} placeholder="you@example.com" required /></label><label>Message<textarea name="message" value={message} onChange={event => { setMessage(event.target.value); setSubmitted(false); }} placeholder="What would you like to build?" required /></label><p style={{ color: 'var(--muted)', margin: 0, fontSize: '.85rem' }}>{message.length} / 500 characters</p><button className="button button-primary" type="submit">Submit demo ↗</button>{submitted && <p className="form-status" role="status">Thanks, {name}! Your demo form was submitted locally; no message was sent.</p>}</form></article></div></section><Footer /></>;
}
