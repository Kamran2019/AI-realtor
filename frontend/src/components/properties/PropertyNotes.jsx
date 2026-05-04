import { useEffect, useState } from "react";
import {
  createPropertyNote,
  deletePropertyNote,
  listPropertyNotes,
  updatePropertyNote
} from "../../services/propertyNoteApi.js";
import FormError from "../ui/FormError.jsx";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    : "Just now";

const getNoteUserId = (note) => {
  if (typeof note.userId === "string") {
    return note.userId;
  }

  return note.user?.id || note.userId?.id || null;
};

const canManageNote = (note, currentUser) =>
  Boolean(
    currentUser &&
      (["admin", "sub_admin"].includes(currentUser.role) || getNoteUserId(note) === currentUser.id)
  );

const PropertyNotes = ({ currentUser, propertyId }) => {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listPropertyNotes(propertyId);

        if (isMounted) {
          setNotes(response.data.data.notes);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Notes could not be loaded."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await createPropertyNote(propertyId, { text });

      setNotes((currentNotes) => [response.data.data.note, ...currentNotes]);
      setText("");
    } catch (createError) {
      setError(getErrorMessage(createError, "Note could not be saved."));
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
  };

  const handleUpdate = async (noteId) => {
    setError("");
    setIsSaving(true);

    try {
      const response = await updatePropertyNote(noteId, { text: editingText });
      const updatedNote = response.data.data.note;

      setNotes((currentNotes) =>
        currentNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      );
      cancelEditing();
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Note could not be updated."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    setError("");
    setIsSaving(true);

    try {
      await deletePropertyNote(noteId);
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Note could not be deleted."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="property-detail-panel property-notes-panel" aria-labelledby="notes-title">
      <h2 id="notes-title">Notes</h2>
      <FormError>{error}</FormError>

      <form className="note-form" onSubmit={handleCreate}>
        <label>
          New note
          <textarea
            maxLength="3000"
            onChange={(event) => setText(event.target.value)}
            rows="4"
            value={text}
          />
        </label>
        <button className="primary-button" disabled={isSaving || !text.trim()} type="submit">
          {isSaving ? "Saving..." : "Add note"}
        </button>
      </form>

      {isLoading ? (
        <p className="muted-note">Loading notes...</p>
      ) : notes.length ? (
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id}>
              <div className="note-meta">
                <strong>{note.user?.name || "User"}</strong>
                <span>{formatDateTime(note.updatedAt || note.createdAt)}</span>
              </div>
              {editingId === note.id ? (
                <div className="note-edit">
                  <textarea
                    maxLength="3000"
                    onChange={(event) => setEditingText(event.target.value)}
                    rows="4"
                    value={editingText}
                  />
                  <div className="form-actions">
                    <button
                      className="primary-button"
                      disabled={isSaving || !editingText.trim()}
                      onClick={() => handleUpdate(note.id)}
                      type="button"
                    >
                      Save
                    </button>
                    <button className="secondary-button" onClick={cancelEditing} type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{note.text}</p>
                  {canManageNote(note, currentUser) ? (
                    <div className="note-actions">
                      <button
                        className="text-button"
                        disabled={isSaving}
                        onClick={() => startEditing(note)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="text-button danger"
                        disabled={isSaving}
                        onClick={() => handleDelete(note.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-note">No notes yet.</p>
      )}
    </section>
  );
};

export default PropertyNotes;
