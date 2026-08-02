import { assetPath } from "@/lib/paths/assetPath";
import { siteConfig } from "@/data/site";
import styles from "./DesignerCredit.module.css";

export function DesignerCredit() {
  const { designer } = siteConfig;
  const imageSrc = assetPath(designer.image);

  return (
    <a
      className={styles.designerCredit}
      href={designer.instagram}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Web tasarımcısı @on_r19 Instagram profilini yeni sekmede aç"
      data-analytics="designer_credit_open"
      data-handle="on_r19"
      data-placement="footer"
    >
      <span className={styles.avatarWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="@on_r19 profil fotoğrafı"
          width={64}
          height={64}
          className={styles.avatar}
          loading="lazy"
          decoding="async"
        />
      </span>

      <span className={styles.copy}>
        <span className={styles.role}>{designer.role}</span>
        <span className={styles.handle}>{designer.name}</span>
        {designer.subtitle ? <span className={styles.sub}>{designer.subtitle}</span> : null}
      </span>

      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
    </a>
  );
}
