import React from "react";
import { BookmarkCheck } from "lucide-react";

export default function MobileSaveToast({ toast, onViewIdeas }) {
  if (!toast) return null;
  return (
    <div className="hm-m-save-toast" role="status">
      <BookmarkCheck size={18} />
      <span>{toast.message}</span>
      {onViewIdeas ? (
        <button type="button" className="hm-m-save-toast-link" onClick={onViewIdeas}>
          View
        </button>
      ) : null}
    </div>
  );
}
