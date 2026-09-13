"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./BiographySection.module.css";

const ALBUMS = [
  { name: "Denetimli Serbestlik Stili (Deluxe)", year: "2012" },
  { name: "DEEV (Deluxe Edition)", year: "2016" },
  { name: "666", year: "2020" },
  { name: "IKARUS", year: "2024" },
];

const SINGLES = [
  "Karma",
  "Yak Yak Yak",
  "Milyon",
  "Kıskanç",
  "Pirana",
  "Hüsran",
  "Dönmedin Ki",
  "Deliyoo",
];

export function BiographySection() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!targets.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((t) => t.classList.add(styles.visible));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(styles.visible);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <section className={`section-shell ${styles.section}`} aria-label="Hakkında">
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true">
        <span className={`display ${styles.ghost}`}>HAKKINDA</span>
      </div>

      <div ref={rootRef} className={`section-content content-medium ${styles.content}`}>
        <Link href="/" className={`editorial-link ${styles.back}`}>
          ← ANA SAYFAYA DÖN
        </Link>

        <p className={`meta-label ${styles.reveal}`} data-reveal>
          HAKKINDA
        </p>
        <h1 className={`display ${styles.title} ${styles.reveal}`} data-reveal>
          ŞEHİNŞAH KİMDİR?
        </h1>
        <p className={`${styles.lede} ${styles.reveal}`} data-reveal>
          Gerçek adıyla Ufuk Yıkılmaz — Türk rap sahnesinin karanlık, sözü güçlü
          isimlerinden biri.
        </p>

        <div className={`${styles.body} ${styles.reveal}`} data-reveal>
          <p>
            Şehinşah, sahne adıyla tanınan ve zaman zaman <strong>HSNSBBH</strong> ismini
            de kullanan <strong>Ufuk Yıkılmaz</strong>&rsquo;ın müzik kimliğidir. 27 Aralık
            1986&rsquo;da Erzincan&rsquo;ın Kemah ilçesinde doğdu. Hip-hop kültürüyle genç
            yaşta tanışıp ilk sözlerini yazmaya başladı; 2002&rsquo;den bu yana kesintisiz
            üretiyor.
          </p>
          <p>
            Adını geniş kitlelere duyuran dönüm noktası, 2017&rsquo;de yayımladığı{" "}
            <strong>&ldquo;Karma&rdquo;</strong> teklisi oldu — Türkiye&rsquo;de trap
            müziğin yükseldiği döneme denk gelen bu şarkı, kariyerinin en belirleyici
            anlarından biri olarak anılır. Kendi çatısı <strong>Karma Company</strong>{" "}
            altında müzik üretmeye devam ediyor.
          </p>
          <p>
            Yazdığı sözlerin genişliği ve deneysel yaklaşımıyla tanınan Şehinşah, yıllar
            içinde farklı tarzları denedi; kimi zaman iniş çıkışlı bir kariyer izlese de
            üretkenliğini hiç kaybetmedi.
          </p>
        </div>

        <div className={`${styles.lists} ${styles.reveal}`} data-reveal>
          <div>
            <h2 className={`display ${styles.listTitle}`}>ALBÜMLER</h2>
            <ul className={styles.list}>
              {ALBUMS.map((a, i) => (
                <li key={a.name} style={{ "--i": i } as React.CSSProperties}>
                  <span className={styles.itemName}>{a.name}</span>
                  <span className={styles.year}>{a.year}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={`display ${styles.listTitle}`}>ÖNE ÇIKAN ŞARKILAR</h2>
            <ul className={styles.list}>
              {SINGLES.map((s, i) => (
                <li key={s} style={{ "--i": i } as React.CSSProperties}>
                  <span className={styles.itemName}>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className={`${styles.footNote} ${styles.reveal}`} data-reveal>
          Güncel diskografinin tamamı için{" "}
          <Link href="/#muzik" className="editorial-link">
            müzik sayfasına
          </Link>
          , koleksiyon parçaları için{" "}
          <Link href="/magaza" className="editorial-link">
            mağazaya
          </Link>{" "}
          göz atabilirsin.
        </p>
      </div>
    </section>
  );
}
