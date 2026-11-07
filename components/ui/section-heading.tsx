import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">
        <span />
        {eyebrow}
      </p>
      <h2 id={id} className="display-heading">
        {title}
      </h2>
      {children && <p className="section-description">{children}</p>}
    </div>
  );
}
