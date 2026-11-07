import assets from "../public/branding/asset-manifest.json";

export type BrandAsset = {
  src: string;
  width: number;
  height: number;
};
export type BrandVariants = { light: BrandAsset; dark: BrandAsset };
export type BrandingSettings = {
  header: BrandVariants;
  footer: BrandVariants;
  loading: BrandVariants & { edgeMask: BrandAsset | null };
  favicon: {
    light: BrandAsset;
    dark: BrandAsset;
    apple: BrandAsset;
    fallback: string;
  };
};

// Public, validated display settings only. A future server-side CMS reader can
// resolve a persisted revision into this shape; no upload/auth API exists yet.
// Light/dark indicate the background on which the artwork will be displayed.
export const brandingDefaults: BrandingSettings = {
  header: { light: assets.light, dark: assets.dark },
  footer: { light: assets.light, dark: assets.dark },
  loading: { light: assets.light, dark: assets.dark, edgeMask: assets.edgeMask },
  favicon: assets.favicon,
};

export const brandName = "AIA Home Solutions BD";
