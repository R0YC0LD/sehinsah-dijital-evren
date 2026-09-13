"use client";

import { useEffect, useState } from "react";
import { products } from "@/data/products";
import type { Comment } from "@/lib/comments/types";
import styles from "./AdminPanel.module.css";

const productName = (id: string) => products.find((p) => p.id === id)?.name || id;

export function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = () => {
    setLoadingComments(true);
    fetch("/api/admin/comments")
      .then((res) => {
        if (res.status === 401) {
          setAuthed(false);
          return null;
        }
        if (!res.ok) throw new Error("failed");
        setAuthed(true);
        return res.json();
      })
      .then((data) => {
        if (data) setComments(data.comments || []);
      })
      .catch(() => setAuthed(false))
      .finally(() => setLoadingComments(false));
  };

  useEffect(() => {
    loadComments();
  }, []);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setLoginError("Kullanıcı adı veya şifre yanlış.");
        return;
      }
      setPassword("");
      loadComments();
    } catch {
      setLoginError("Giriş yapılamadı, tekrar dene.");
    } finally {
      setLoggingIn(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setComments([]);
  };

  const onDelete = async (id: string) => {
    const prev = comments;
    setComments((cur) => cur.filter((c) => c.id !== id));
    const res = await fetch(`/api/admin/comments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) setComments(prev);
  };

  if (authed === null) {
    return <p className={styles.status}>Yükleniyor…</p>;
  }

  if (!authed) {
    return (
      <form className={styles.loginForm} onSubmit={onLogin}>
        <h1 className={`display ${styles.title}`}>YÖNETİM</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Kullanıcı adı"
          required
          className={styles.input}
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          required
          className={styles.input}
          autoComplete="current-password"
        />
        <button type="submit" className={styles.submit} disabled={loggingIn}>
          {loggingIn ? "GİRİŞ YAPILIYOR…" : "GİRİŞ YAP"}
        </button>
        {loginError ? <p className={styles.error}>{loginError}</p> : null}
      </form>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h1 className={`display ${styles.title}`}>YORUM YÖNETİMİ</h1>
        <button type="button" className={styles.logout} onClick={onLogout}>
          ÇIKIŞ YAP
        </button>
      </div>

      {loadingComments ? (
        <p className={styles.status}>Yükleniyor…</p>
      ) : comments.length === 0 ? (
        <p className={styles.status}>Henüz yorum yok.</p>
      ) : (
        <div className={styles.list}>
          {comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.commentHead}>
                <span className={styles.commentProduct}>{productName(c.productId)}</span>
                <span className={styles.commentDate}>
                  {new Date(c.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
              <p className={styles.commentName}>{c.name}</p>
              <p className={styles.commentText}>{c.text}</p>
              <button type="button" className={styles.delete} onClick={() => onDelete(c.id)}>
                SİL
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
