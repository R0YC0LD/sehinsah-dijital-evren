import { MediaImage } from "@/components/ui/MediaImage";
import { siteConfig } from "@/data/site";
import styles from "./InstagramSection.module.css";

export function InstagramSection() {
  return (
    <section id="instagram" className={styles.section} aria-label="Instagram">
      <h2 className={`display ${styles.title}`}>{siteConfig.instagram.title}</h2>

      <a
        href={siteConfig.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.portal}
        aria-label="Şehinşah Instagram profiline git (yeni sekme)"
      >
        <div className={styles.ring} aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs>
              <path
                id="igCircle"
                d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
              />
            </defs>
            <text className={styles.ringText}>
              <textPath href="#igCircle">{siteConfig.instagram.ring}</textPath>
            </text>
          </svg>
        </div>
        <div className={styles.avatar}>
          <MediaImage
            src={siteConfig.media.instagram}
            alt="Şehinşah Instagram profil görseli"
            width={150}
            height={150}
            className={styles.avatarImg}
            onErrorFallback={<span className={styles.fallback}>ŞŞ</span>}
          />
        </div>
      </a>

      <p className={styles.handle}>{siteConfig.instagram.username}</p>
      <a
        href={siteConfig.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`editorial-link ${styles.cta}`}
        aria-label="Instagram’a git (yeni sekme)"
      >
        {siteConfig.instagram.cta}
      </a>
    </section>
  );
}
