import { useState } from "react";

function Contact() {

    const [message, setMessage] = useState("");

    const [showHelp, setShowHelp] = useState(false);

    return (

        <div>

            <h1>Contact Page</h1>

            <input
                type="text"
                placeholder="Enter your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <p>Message:</p>

            <h3>{message}</h3>

            <p>Characters: {message.length}</p>

            <button onClick={() => setShowHelp(!showHelp)}>
                Toggle Help
            </button>

            {showHelp &&

                <p>Please enter your message above.</p>

            }

        </div>

    );

}

export default Contact;