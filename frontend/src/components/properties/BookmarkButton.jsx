import { useEffect, useState } from "react";
import { toggleBookmark } from "../../services/bookmarkApi.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const BookmarkButton = ({ isBookmarked = false, onChange, propertyId }) => {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBookmarked(isBookmarked);
  }, [isBookmarked]);

  const handleToggle = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await toggleBookmark(propertyId);
      const nextBookmarked = response.data.data.bookmarked;

      setBookmarked(nextBookmarked);
      onChange?.(propertyId, nextBookmarked);
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Bookmark could not be updated."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bookmark-control">
      <button
        aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
        aria-pressed={bookmarked}
        className={`bookmark-button${bookmarked ? " active" : ""}`}
        disabled={isSaving}
        onClick={handleToggle}
        title={bookmarked ? "Remove bookmark" : "Save bookmark"}
        type="button"
      >
        <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
        <span>{bookmarked ? "Saved" : "Save"}</span>
      </button>
      {error ? <span className="inline-error">{error}</span> : null}
    </div>
  );
};

export default BookmarkButton;
