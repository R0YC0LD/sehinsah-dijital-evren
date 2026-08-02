"use client";

import Image from "next/image";
import { useState } from "react";
import { siteConfig } from "@/data/site";
import styles from "./InstagramPortal.module.css";

export function InstagramPortal() {
  const [imgOk, setImgOk] = useState(true);

  return (
    <section
      id="instagram"
      className={styles.section}
      data-section="instagram"
      aria-label="Instagram"
    >
      <p className={`display ${styles.bgWord}`} aria-hidden="true">
        TAKİP ET
      </p>

      <div className={styles.content}>
        <p className={styles.index}>06 — INSTAGRAM</p>
        <h2 className={`display ${styles.title}`}>{siteConfig.instagram.title}</h2>

        <a
          href={siteConfig.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.portal}
          data-cursor="GİT ↗"
          aria-label="Şehinşah Instagram profiline git (yeni sekme)"
        >
          <div className={styles.ring} aria-hidden="true">
            <svg viewBox="0 0 200 200">
              <defs>
                <path
                  id="circlePath"
                  d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                />
              </defs>
              <text className={styles.ringText}>
                <textPath href="#circlePath">
                  {siteConfig.instagram.ring}
                </textPath>
              </text>
            </svg>
          </div>

          <div className={styles.avatar}>
            {imgOk ? (
              <Image
                src={siteConfig.media.instagram}
                alt="Şehinşah Instagram profil görseli"
                width={150}
                height={150}
                className={styles.avatarImg}
                onError={() => setImgOk(false)}
              />
            ) : (
              <span className={styles.avatarFallback}>ŞŞ</span>
            )}
          </div>
        </a>

        <p className={styles.handle}>{siteConfig.instagram.handle}</p>
        <a
          href={siteConfig.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={`editorial-link ${styles.cta}`}
          data-cursor="GİT ↗"
          aria-label="Instagram’a git (yeni sekme)"
        >
          {siteConfig.instagram.cta}
        </a>
      </div>
    </section>
  );
}
