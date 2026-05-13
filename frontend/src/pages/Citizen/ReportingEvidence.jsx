import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/ReportingEvidence.css";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED = ["image/jpeg", "image/png", "video/mp4", "audio/mpeg", "audio/mp3"];
const ACCEPT_STRING = ".jpg,.jpeg,.png,.mp4,.mp3";

const getFileIcon = (type) => {
  if (type.startsWith("image/")) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
  if (type.startsWith("video/")) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
};

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ReportingEvidence = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const category = state?.category || "incident";
  const location = state?.location || null;

  // Restore description and files when navigating back from the review step
  const [description, setDescription] = useState(state?.description || "");
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState(
    () => (state?.files || []).map((f) => ({ ...f, id: `restored-${f.name}-${f.size}`, status: "done", progress: 100, preview: null, file: null }))
  );
  const [descError, setDescError] = useState("");

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const MAX_CHARS = 2000;

  /* ── Add files ── */
  const addFiles = useCallback((rawFiles) => {
    const newEntries = [];
    Array.from(rawFiles).forEach((file) => {
      if (!ACCEPTED.includes(file.type)) return;
      if (file.size > MAX_FILE_SIZE) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const entry = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        file,
      };
      newEntries.push(entry);

      // Simulate upload progress
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 18 + 5;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress: 100, status: "done" } : f))
          );
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress: Math.round(prog) } : f))
          );
        }
      }, 200);
    });
    setFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleRemove = (id) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  /* ── Voice recording (Web Speech API) ── */
  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setDescription((prev) => {
        const combined = prev ? `${prev} ${transcript}` : transcript;
        return combined.slice(0, MAX_CHARS);
      });
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  /* ── Submit ── */
  const handleNext = () => {
    if (!description.trim()) {
      setDescError("Please describe what happened before continuing.");
      return;
    }
    navigate("/report/review", {
      state: { category, location, description, files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })) },
    });
  };

  return (
    <div className="re-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      <main className="re-main">
        <div className="re-container">

          {/* Progress */}
          <div className="re-progress-block">
            <div className="re-progress-top">
              <span className="re-progress-label">Step 3 of 4: Incident Description</span>
              <span className="re-progress-pct">75%</span>
            </div>
            <div className="re-progress-bar">
              <div className="re-progress-fill" style={{ width: "75%" }} />
            </div>
          </div>

          {/* Description Card */}
          <div className="re-card">
            <h1 className="re-heading">What happened?</h1>
            <p className="re-subheading">
              Please provide as much detail as possible. Your information helps us act faster and categorize the incident correctly.
            </p>

            <div className={`re-textarea-wrapper ${descError ? "re-textarea-wrapper--error" : ""} ${isRecording ? "re-textarea-wrapper--recording" : ""}`}>
              <textarea
                className="re-textarea"
                placeholder="Start typing here... For example: 'I was walking near the bus stop when two individuals approached me...'"
                value={description}
                maxLength={MAX_CHARS}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descError) setDescError("");
                }}
              />
              <div className="re-textarea-footer">
                <span className="re-char-count">
                  {description.length}/{MAX_CHARS} characters
                </span>
                <button
                  type="button"
                  className={`re-mic-btn ${isRecording ? "re-mic-btn--active" : ""}`}
                  onClick={toggleRecording}
                  title={isRecording ? "Stop recording" : "Dictate"}
                >
                  {isRecording && <span className="re-mic-pulse" />}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              </div>
            </div>
            {descError && <span className="re-error">{descError}</span>}
          </div>

          {/* Evidence Upload */}
          <div className="re-evidence-section">
            <div className="re-evidence-header">
              <h2 className="re-evidence-title">Evidence Upload</h2>
              <span className="re-secure-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Secure &amp; Encrypted
              </span>
            </div>

            {/* Drop Zone */}
            <div
              className={`re-dropzone ${isDragging ? "re-dropzone--active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_STRING}
                multiple
                className="re-file-input"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
              />
              <input ref={photoInputRef} type="file" accept=".jpg,.jpeg,.png" multiple className="re-file-input"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={videoInputRef} type="file" accept=".mp4" multiple className="re-file-input"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={audioInputRef} type="file" accept=".mp3" multiple className="re-file-input"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

              <div className="re-dropzone__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>
              <p className="re-dropzone__label">Click or drag files to upload</p>
              <p className="re-dropzone__hint">Max 50MB per file. Supported: JPG, PNG, MP4, MP3.</p>

              <div className="re-dropzone__btns" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="re-type-btn re-type-btn--photo" onClick={() => photoInputRef.current?.click()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  Add Photos
                </button>
                <button type="button" className="re-type-btn re-type-btn--video" onClick={() => videoInputRef.current?.click()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  Add Video
                </button>
                <button type="button" className="re-type-btn re-type-btn--audio" onClick={() => audioInputRef.current?.click()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                  Add Audio
                </button>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="re-file-list">
                {files.map((f) => (
                  <div key={f.id} className="re-file-item">
                    <div className="re-file-item__thumb">
                      {f.preview ? (
                        <img src={f.preview} alt={f.name} className="re-file-item__img" />
                      ) : (
                        <span className={`re-file-item__icon re-file-item__icon--${f.type.startsWith("video/") ? "video" : "audio"}`}>
                          {getFileIcon(f.type)}
                        </span>
                      )}
                    </div>
                    <div className="re-file-item__info">
                      <div className="re-file-item__row">
                        <span className="re-file-item__name">{f.name}</span>
                        <button
                          type="button"
                          className="re-file-item__remove"
                          onClick={() => handleRemove(f.id)}
                          aria-label="Remove file"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                      <span className="re-file-item__meta">
                        {formatSize(f.size)} · {f.status === "done" ? "Uploaded" : `${f.progress}%`}
                      </span>
                      {f.status === "uploading" && (
                        <div className="re-file-progress">
                          <div className="re-file-progress__bar" style={{ width: `${f.progress}%` }} />
                        </div>
                      )}
                    </div>
                    {f.status === "uploading" && (
                      <button
                        type="button"
                        className="re-file-item__cancel"
                        onClick={() => handleRemove(f.id)}
                        aria-label="Cancel upload"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nav Actions */}
          <div className="re-nav-actions">
            <button type="button" className="re-back-btn"
              onClick={() => navigate("/report/location", { state: { category, location } })}>
              Back
            </button>
            <button type="button" className="re-next-btn" onClick={handleNext}>
              Next Step
            </button>
          </div>

        </div>
      </main>

      <CitizenFooter />
    </div>
  );
};

export default ReportingEvidence;