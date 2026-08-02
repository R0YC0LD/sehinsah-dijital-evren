import { EntropyBrain } from "@/components/easteregg/EntropyBrain";
import { PlatformLinks } from "@/components/platforms/PlatformLinks";
import { MediaImage } from "@/components/ui/MediaImage";
import { siteConfig } from "@/data/site";
import styles from "./InstagramSection.module.css";

export function InstagramSection() {
  return (
    <section
      id="instagram"
      className={`section-shell ${styles.section}`}
      aria-label="Instagram"
    >
      <div className={`section-backdrop ${styles.backdrop}`} aria-hidden="true" />

      <div className={`section-content ${styles.content}`}>
        <div className={styles.copy}>
          <p className="meta-label">04 / SOSYAL</p>
          <h2 className={`display ${styles.title}`}>{siteConfig.instagram.title}</h2>
          <p className={styles.handle}>{siteConfig.instagram.username}</p>
          <a
            href={siteConfig.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`editorial-link ${styles.cta}`}
          >
            {siteConfig.instagram.cta}
          </a>
          <div className={styles.socialRow}>
            <span className="meta-label">SOSYAL</span>
            <PlatformLinks variant="social" placement="social-section" />
          </div>
        </div>

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
            />
          </div>
        </a>
      </div>
      <EntropyBrain id="instagram-ring-side" />
    </section>
  );
}
