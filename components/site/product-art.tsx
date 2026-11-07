import type { ProductShape } from "@/lib/site-content";

export function ProductArt({ shape }: { shape: ProductShape }) {
  return (
    <div className={`product-art art-${shape}`} aria-hidden="true">
      <div className="product-ground" />
      <div className="product-halo" />
      <div className="lamp">
        <span className="lamp-cable cable-one" />
        <span className="lamp-cable cable-two" />
        <span className="lamp-body" />
        <span className="lamp-light" />
        <span className="lamp-secondary" />
      </div>
    </div>
  );
}
