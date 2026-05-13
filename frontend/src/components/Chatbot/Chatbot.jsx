import { useState, useRef, useEffect } from "react";
import { sendMessage, sendPublicMessage } from "../../api/chatbot";
import "./Chatbot.css";

const QUICK_QUESTIONS = [
  "How do I report a crime?",
  "What victim support is available?",
  "How do I track my case?",
  "What is the emergency number?",
];

const WELCOME_MESSAGE = {
  role:    "assistant",
  content: "Hello! I'm CRIMSON Assistant 👋\n\nI can help you with:\n• Reporting a crime\n• Tracking your case\n• Victim support services\n• Safety tips\n\nHow can I help you today?",
};

export default function Chatbot({ isPublic = false }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;

    // Add user message to UI
    const userMsg = { role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // History = all messages except welcome message
      const history = messages.slice(1);

      const res = isPublic
        ? await sendPublicMessage(msgText)
        : await sendMessage(msgText, history);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: res.data.reply }
      ]);

    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      setMessages(prev => [
        ...prev,
        {
          role:    "assistant",
          content: serverMsg || "Sorry, I'm having trouble connecting. Please try again or call **119** for emergencies."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        className={`cb-fab ${open ? "cb-fab-open" : ""}`}
        onClick={() => setOpen(p => !p)}
        aria-label="CRIMSON Assistant"
      >
        {open ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
            <span className="cb-fab-label">Close Chat</span>
          </>
        ) : (
          <>
            <span className="cb-fab-icon">🤖</span>
            <span className="cb-fab-label">AI Support<br />Chat Assistant</span>
          </>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="cb-window">

          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-left">
              <div className="cb-logo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="cb-name">CRIMSON Assistant</p>
                <p className="cb-online">
                  <span className="cb-dot"/>
                  Online · Powered by Gemini
                </p>
              </div>
            </div>
            <div className="cb-header-actions">
              <button className="cb-icon-btn" onClick={clearChat} title="Clear chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
              <button className="cb-icon-btn" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6"  x2="6"  y2="18"/>
                  <line x1="6"  y1="6"  x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`cb-row cb-${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="cb-avatar">AI</div>
                )}
                <div className={`cb-bubble cb-bubble-${msg.role}`}>
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split("\n").length - 1 && <br/>}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div className="cb-row cb-assistant">
                <div className="cb-avatar">AI</div>
                <div className="cb-bubble cb-bubble-assistant cb-typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}

            {/* Quick questions — only at start */}
            {messages.length === 1 && !loading && (
              <div className="cb-quick">
                <p className="cb-quick-label">Quick questions:</p>
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    className="cb-quick-btn"
                    onClick={() => send(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef}/>
          </div>

          {/* Emergency Banner */}
          <div className="cb-emergency">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Emergency? Call <strong>119</strong> immediately
          </div>

          {/* Input */}
          <div className="cb-input-row">
            <input
              ref={inputRef}
              className="cb-input"
              placeholder="Type your message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className={`cb-send ${input.trim() ? "cb-send-active" : ""}`}
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2"  x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

        </div>
      )}
    </>
  );
}