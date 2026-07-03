"use client";

import { useState } from "react";

interface Note {
  _id?: string;
  content: string;
  createdAt: string;
}

interface NotesListProps {
  notes: Note[];
  onAddNote: (content: string) => void;
}

export default function NotesList({ notes, onAddNote }: NotesListProps) {
  const [newNote, setNewNote] = useState("");

  const handleAdd = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="notes-section">
      <label className="form-label">Notlar</label>

      <div className="note-input-wrapper">
        <textarea
          id="new-note-input"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Yeni not ekle..."
          className="form-textarea"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <div className="note-input-footer">
          <span className="note-hint">Ctrl+Enter ile kaydet</span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newNote.trim()}
            className="btn btn-primary btn-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Not Ekle
          </button>
        </div>
      </div>

      {sortedNotes.length > 0 ? (
        <div className="notes-list">
          {sortedNotes.map((note, index) => (
            <div key={note._id || index} className="note-item">
              <div className="note-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="note-date">
                  {new Date(note.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="note-content">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="notes-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>Henüz not eklenmemiş</p>
        </div>
      )}
    </div>
  );
}
