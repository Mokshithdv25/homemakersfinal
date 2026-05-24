import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hm_ideabooks_v1";
const DEFAULT_BOOK = { id: "default", name: "Ideabook", createdAt: null, items: [] };

function readBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [{ ...DEFAULT_BOOK, createdAt: new Date().toISOString() }];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [{ ...DEFAULT_BOOK, createdAt: new Date().toISOString() }];
    }
    return parsed;
  } catch {
    return [{ ...DEFAULT_BOOK, createdAt: new Date().toISOString() }];
  }
}

function writeBooks(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function useIdeabooks() {
  const [books, setBooks] = useState(readBooks);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    writeBooks(books);
  }, [books]);

  const savePhoto = useCallback((photo, bookId = "default") => {
    const item = {
      id: photo.id || `saved_${Date.now()}`,
      url: photo.url,
      title: photo.title || photo.room || "Saved photo",
      room: photo.room || "",
      style: photo.style || "",
      savedAt: new Date().toISOString(),
    };
    setBooks((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bookId) return b;
        if (b.items.some((i) => i.id === item.id)) return b;
        return { ...b, items: [item, ...b.items] };
      });
      return next;
    });
    setToast({ message: "Saved to Ideabooks", bookId });
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, []);

  const removePhoto = useCallback((itemId, bookId = "default") => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, items: b.items.filter((i) => i.id !== itemId) } : b))
    );
  }, []);

  const isSaved = useCallback(
    (photoId) => books.some((b) => b.items.some((i) => i.id === photoId)),
    [books]
  );

  const totalSaved = books.reduce((n, b) => n + b.items.length, 0);

  return { books, savePhoto, removePhoto, isSaved, totalSaved, toast, clearToast: () => setToast(null) };
}
