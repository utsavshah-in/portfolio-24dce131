import { useState } from "react";

function Contact() {
  const [message, setMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main>
      <section>
        <h2>Contact Me</h2>

        <label htmlFor="message">Your Message</label>

        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          rows="6"
        />

        <p>Characters: {message.length}</p>

        <button onClick={() => setShowHelp(!showHelp)}>
          {showHelp ? "Hide Help" : "Show Help"}
        </button>

        {showHelp && (
          <p className="help-text">
            You can use this form to send a message or ask about my
            projects and skills.
          </p>
        )}

        <p>
          <strong>Live Preview:</strong> {message}
        </p>
      </section>
    </main>
  );
}

export default Contact;