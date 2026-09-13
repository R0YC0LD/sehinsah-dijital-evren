"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/comments/types";
import styles from "./ProductComments.module.css";

const NAME_MAX_LENGTH = 24;

type Props = {
  productId: string;
};

export function ProductComments({ productId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments?productId=${encodeURIComponent(productId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) setComments(data.comments || []);
      })
      .catch(() => {
        if (!cancelled) setError("Yorumlar yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name: name.trim(), text: text.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "failed");
      }
      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setName("");
      setText("");
    } catch (err) {
      const code = err instanceof Error ? err.message : "failed";
      if (code === "inappropriate_name") {
        setError("Girdiğin isim uygun değil, lütfen normal bir isim yaz.");
      } else if (code === "inappropriate_text") {
        setError("Yorumun uygunsuz veya anlamsız görünüyor, lütfen düzenleyip tekrar dene.");
      } else if (code === "invalid_name") {
        setError(`İsim en fazla ${NAME_MAX_LENGTH} karakter olabilir.`);
      } else if (code === "invalid_text") {
        setError("Yorum boş olamaz ve 500 karakteri geçemez.");
      } else {
        setError("Yorum gönderilemedi, tekrar dene.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h2 className={`display ${styles.title}`}>YORUMLAR</h2>

      <form className={styles.form} onSubmit={onSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="İsmin"
          maxLength={NAME_MAX_LENGTH}
          required
          className={styles.input}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Yorumun"
          maxLength={500}
          required
          rows={3}
          className={styles.textarea}
        />
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "GÖNDERİLİYOR…" : "YORUM YAP"}
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Yükleniyor…</p>
        ) : comments.length === 0 ? (
          <p className={styles.empty}>İlk yorumu sen yap.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.commentHead}>
                <span className={styles.commentName}>{c.name}</span>
                <span className={styles.commentDate}>
                  {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <p className={styles.commentText}>{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
