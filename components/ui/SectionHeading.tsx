import styles from "./SectionHeading.module.css";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SectionHeading({ eyebrow, title, subtitle, action }: Props) {
  return (
    <div className={styles.wrap}>
      <div>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={`display ${styles.title}`}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
