import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/Officer/Communication.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { formatOfficerDate, formatOfficerTime } from "../../lib/officerPreferences";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "OF";

const formatTime = (dateLike) => formatOfficerTime(dateLike, { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateLike) => formatOfficerDate(dateLike, { year: "numeric", month: "2-digit", day: "2-digit" });

// Show a human-readable last-message preview (hashed filenames → readable label)
const cleanPreview = (text = "") => {
  if (!text || text === "No messages yet") return text || "No messages yet";
  // If it looks like a filename (no spaces, has extension) → show readable label
  if (!text.includes(" ") && /\.[a-z0-9]{2,5}$/i.test(text)) {
    if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(text)) return "📷 Photo";
    if (/\.(mp4|mov|avi|webm|mkv)$/i.test(text)) return "🎬 Video";
    return "📎 File";
  }
  return text;
};

const attachmentUrl = (url = "") => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
};

const dedupeMessagesById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.id || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ── messenger components ───────────────────────────────────
const ACCEPT_TYPES = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";

function OfficerAvatar({ name, mine = false, size = 38 }) {
  return (
    <span
      className={`oc-avatar ${mine ? "oc-avatar-me" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials(name)}
    </span>
  );
}

function AttachPreview({ attachment }) {
  if (!attachment) return null;
  const url = attachmentUrl(attachment.url);
  if (attachment.kind === "image")
    return (
      <a href={url} target="_blank" rel="noreferrer" className="att-img-wrap">
        <img src={url} alt={attachment.originalName} className="att-img" />
      </a>
    );
  if (attachment.kind === "video")
    return (
      <video controls className="att-video">
        <source src={url} type={attachment.mimeType || "video/mp4"} />
      </video>
    );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="att-file">
      <span className="att-file-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </span>
      <span className="att-file-info">
        <strong>{attachment.originalName}</strong>
        <small>Download</small>
      </span>
    </a>
  );
}

// ── main component ─────────────────────────────────────────
export default function Communication() {
  const { user } = useAuth();

  // ── state ──
  const [officers, setOfficers]         = useState([]);   // all other active officers
  const [conversations, setConversations] = useState([]);   // existing conversations
  const [activeId, setActiveId]         = useState(null); // currently open conversation id
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [pickedFile, setPickedFile]     = useState(null);
  const [busy, setBusy]                 = useState(false);
  const [loadingList, setLoadingList]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [showNewChat, setShowNewChat]   = useState(false);
  const [hiddenOfficerIds, setHiddenOfficerIds] = useState([]);

  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const inputRef   = useRef(null);

  // ── data fetching ──
  const loadAll = useCallback(async () => {
    const [{ data: cRes }, { data: oRes }] = await Promise.all([
      api.get("/officer-chat/conversations"),
      api.get("/officer-chat/officers"),
    ]);
    setConversations(cRes?.data || []);
    setOfficers(oRes?.data || []);
  }, []);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) { setMessages([]); return; }
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/officer-chat/conversations/${convId}/messages`);
      setMessages(dedupeMessagesById(data?.data || []));
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingList(true);
      try {
        await loadAll();
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || "Failed to load chats.");
      } finally {
        if (mounted) setLoadingList(false);
      }
    })();
    return () => { mounted = false; };
  }, [loadAll]);

  // open first conversation by default
  useEffect(() => {
    setActiveId((prev) => {
      const valid = conversations.some((c) => c.id === prev);
      return valid ? prev : conversations[0]?.id || null;
    });
  }, [conversations]);

  // load messages whenever active conversation changes
  useEffect(() => {
    loadMessages(activeId).catch(() => {});
  }, [activeId, loadMessages]);

  // poll every 5 s for new messages
  useEffect(() => {
    const id = setInterval(() => {
      loadMessages(activeId).catch(() => {});
      loadAll().catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [activeId, loadAll, loadMessages]);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── derived ──
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  // contacts = merge conversations (with preview) + ungrouped officers
  const convPartnerIds = useMemo(
    () => new Set(conversations.map((c) => String(c.partner?.id))),
    [conversations]
  );
  const ungroupedOfficers = useMemo(
    () => officers.filter(
      (o) => !convPartnerIds.has(String(o._id)) && !hiddenOfficerIds.includes(String(o._id))
    ),
    [officers, convPartnerIds, hiddenOfficerIds]
  );

  const lc = search.toLowerCase();
  const filteredConvs = conversations.filter(
    (c) => !lc || (c.partner?.fullName || "").toLowerCase().includes(lc)
  );
  const filteredOfficers = ungroupedOfficers.filter(
    (o) => !lc || (o.fullName || "").toLowerCase().includes(lc)
  );

  // ── actions ──
  const openOrStart = async (officerId) => {
    if (busy) return;
    // already have a conversation with this officer → just open it
    const existing = conversations.find(
      (c) => String(c.partner?.id) === String(officerId)
    );
    if (existing) {
      setActiveId(existing.id);
      setShowNewChat(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/officer-chat/conversations", { officerId });
      const newId = data?.data?.id;
      setHiddenOfficerIds((prev) => prev.filter((id) => id !== String(officerId)));
      await loadAll();
      if (newId) {
        setActiveId(newId);
        await loadMessages(newId);
      }
      setShowNewChat(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start conversation.");
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    if (!activeId || busy) return;
    const text = input.trim();
    if (!text && !pickedFile) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    if (text) fd.append("text", text);
    if (pickedFile) fd.append("file", pickedFile);
    try {
      const { data } = await api.post(
        `/officer-chat/conversations/${activeId}/messages`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const created = data?.data;
      if (created) {
        setMessages((prev) => dedupeMessagesById([...prev, created]));
      }
      setInput("");
      setPickedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const deleteConversation = async (conversationId, partnerName) => {
    if (!conversationId || busy) return;
    const ok = window.confirm(`Delete chat with ${partnerName || "this officer"}? This cannot be undone.`);
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      await api.delete(`/officer-chat/conversations/${conversationId}`);
      setMessages([]);
      const removed = conversations.find((c) => c.id === conversationId);
      if (removed?.partner?.id) {
        setHiddenOfficerIds((prev) => Array.from(new Set([...prev, String(removed.partner.id)])));
      }
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setActiveId((prev) => (prev === conversationId ? null : prev));
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete conversation.");
    } finally {
      setBusy(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const canSend = Boolean(input.trim() || pickedFile) && !busy && Boolean(activeId);

  return (
    <div className="comm-page officer-with-sidebar">
      <OfficerSidebar />

      {/* ── messenger wrapper ── */}
      <div className="cm-outer">

        {/* == LEFT: contacts / conversations ========================= */}
        <aside className="cm-left">
          {/* my profile strip */}
          <div className="cm-me">
            <OfficerAvatar name={user?.fullName || ""} mine size={40} />
            <div className="cm-me-info">
              <strong>{user?.fullName || "Officer"}</strong>
              <small>{user?.district || user?.division || "Officer"}</small>
            </div>
            <button
              className="cm-new-btn"
              title="New conversation"
              onClick={() => setShowNewChat((v) => !v)}
            >
              +
            </button>
          </div>

          {/* search */}
          <div className="cm-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="cm-search-icon">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="cm-search"
              placeholder="Search officers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ── new chat picker (dropdown) ── */}
          {showNewChat && (
            <div className="cm-new-picker">
              <p className="cm-picker-title">Select officer to chat with</p>
              {officers.length === 0 ? (
                <p className="cm-picker-empty">No other active officers found.</p>
              ) : (
                officers.map((o) => (
                  <button key={o._id} className="cm-picker-row" onClick={() => openOrStart(o._id)} disabled={busy}>
                    <OfficerAvatar name={o.fullName} size={34} />
                    <span className="cm-picker-info">
                      <strong>{o.fullName}</strong>
                      <small>{o.district || o.division || "Officer"}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="cm-contacts">
            {loadingList ? (
              <p className="cm-muted">Loading...</p>
            ) : null}

            {/* ── existing conversations ── */}
            {filteredConvs.map((conv) => (
              <div key={conv.id} className={`cm-contact-row ${activeId === conv.id ? "active" : ""}`}>
                <button
                  className="cm-contact-main"
                  onClick={() => { setActiveId(conv.id); setShowNewChat(false); }}
                >
                  <OfficerAvatar name={conv.partner?.fullName || ""} size={40} />
                  <span className="cm-contact-info">
                    <span className="cm-contact-top">
                      <strong>{conv.partner?.fullName || "Unknown Officer"}</strong>
                      <small className="cm-contact-time">{conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ""}</small>
                    </span>
                    <small className="cm-contact-preview">{cleanPreview(conv.lastMessagePreview)}</small>
                  </span>
                </button>
                <button
                  className="cm-delete-chat-btn"
                  title={`Delete chat with ${conv.partner?.fullName || "officer"}`}
                  onClick={() => deleteConversation(conv.id, conv.partner?.fullName)}
                  disabled={busy}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}

            {/* ── ungrouped officers (no conversation yet) ── */}
            {filteredOfficers.length > 0 && (
              <>
                {filteredConvs.length > 0 && <div className="cm-divider">Other Officers</div>}
                {filteredOfficers.map((o) => (
                  <button
                    key={o._id}
                    className="cm-contact-row cm-contact-new"
                    onClick={() => openOrStart(o._id)}
                    disabled={busy}
                  >
                    <OfficerAvatar name={o.fullName} size={40} />
                    <span className="cm-contact-info">
                      <span className="cm-contact-top">
                        <strong>{o.fullName}</strong>
                      </span>
                      <small className="cm-contact-preview">{o.district || o.division || "Officer"}</small>
                    </span>
                    <span className="cm-start-tag">Chat</span>
                  </button>
                ))}
              </>
            )}

            {!loadingList && filteredConvs.length === 0 && filteredOfficers.length === 0 && (
              <p className="cm-muted">No officers found.</p>
            )}
          </div>
        </aside>

        {/* == RIGHT: active chat ==================================== */}
        <section className="cm-chat">
          {!activeId ? (
            <div className="cm-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h3>Select a conversation</h3>
              <p>Click any officer on the left to open a chat, or press the <strong>+ button</strong> at the top to start a new one.</p>
            </div>
          ) : (
            <>
              {/* header */}
              <div className="cm-chat-header">
                <OfficerAvatar name={activeConversation?.partner?.fullName || ""} size={38} />
                <div className="cm-chat-header-info">
                  <strong>{activeConversation?.partner?.fullName || "Unknown Officer"}</strong>
                  <small>{activeConversation?.partner?.district ? `District: ${activeConversation.partner.district}` : "Active now"}</small>
                </div>
                <span className="cm-you-chip">
                  <OfficerAvatar name={user?.fullName || ""} mine size={24} />
                  &nbsp;{user?.fullName}
                </span>
              </div>

              {/* messages */}
              <div className="cm-msgs">
                {error ? <p className="cm-error">{error}</p> : null}

                {loadingMsgs && messages.length === 0 ? (
                  <p className="cm-muted">Loading messages…</p>
                ) : null}

                {!loadingMsgs && messages.length === 0 ? (
                  <div className="cm-no-msgs">
                    <p>No messages yet.</p>
                    <p>Say hello to <strong>{activeConversation?.partner?.fullName}</strong>!</p>
                  </div>
                ) : null}

                {messages.map((msg) => (
                  <div key={msg.id} className={`cm-msg-row ${msg.mine ? "cm-mine" : "cm-theirs"}`}>
                    <OfficerAvatar
                      name={msg.mine ? user?.fullName : msg.sender?.fullName}
                      mine={msg.mine}
                      size={32}
                    />
                    <div className="cm-msg-body">
                      {(msg.text || msg.attachment) && (
                        <div className={`cm-bubble ${msg.mine ? "cm-bubble-mine" : "cm-bubble-theirs"}`}>
                          {msg.text ? <p className="cm-bubble-text">{msg.text}</p> : null}
                          <AttachPreview attachment={msg.attachment} />
                        </div>
                      )}
                      <p className="cm-msg-meta">
                        {msg.mine ? "You" : msg.sender?.fullName} · {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* input */}
              <div className="cm-input-area">
                {pickedFile && (
                  <div className="cm-file-preview">
                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" width="14" height="14">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span>{pickedFile.name}</span>
                    <button
                      className="cm-remove-file"
                      onClick={() => { setPickedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                      aria-label="Remove attachment"
                    >✕</button>
                  </div>
                )}
                <div className="cm-input-row">
                  <button
                    className="cm-attach-btn"
                    onClick={() => fileRef.current?.click()}
                    title="Attach image, video, or file"
                    disabled={busy}
                  >
                    📎
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT_TYPES}
                    style={{ display: "none" }}
                    onChange={(e) => setPickedFile(e.target.files?.[0] || null)}
                  />
                  <input
                    ref={inputRef}
                    className="cm-text-input"
                    placeholder="Type a message… (Enter to send)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={busy}
                  />
                  <button
                    className={`cm-send-btn ${canSend ? "active" : ""}`}
                    onClick={sendMessage}
                    disabled={!canSend}
                    title="Send (Enter)"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}