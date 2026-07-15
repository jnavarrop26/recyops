import { ReactNode } from "react";
import styles from "@/app/shared/components/page.module.css";

export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.body}>
        {children ?? "Contenido en construcción."}
      </div>
    </div>
  );
}
