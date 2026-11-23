import { text } from "./i18n";
import type { ProductConcept } from "./public-content";

const products = [
  ["DS-2CD2043G2-I(U)", "4 MP", "Bullet", "IP", "AcuSense", "hikvision-ds-2cd2043g2-iu.webp", "IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2043g2-i-u-/"],
  ["DS-2CD2143G2-I(S)", "4 MP", "Dome", "IP", "AcuSense", "hikvision-ds-2cd2143g2-is.webp", "IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2143g2-i-s-/"],
  ["DS-2CD2343G2-I(U)", "4 MP", "Turret", "IP", "AcuSense", "hikvision-ds-2cd2343g2-iu.webp", "IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2343g2-i-u-/"],
  ["DS-2CE16D0T-LPFS", "2 MP", "Bullet", "Analog", "Smart Hybrid Light", "hikvision-ds-2ce16d0t-lpfs.webp", "Turbo-HD-Products/Turbo-HD-Cameras/smart-hybrid-light-series/ds-2ce16d0t-lpfs/"],
  ["DS-2CE76D0T-LPFS", "2 MP", "Turret", "Analog", "Smart Hybrid Light", "hikvision-ds-2ce76d0t-lpfs.webp", "Turbo-HD-Products/Turbo-HD-Cameras/smart-hybrid-light-series/ds-2ce76d0t-lpfs/"],
  ["DS-2DE2A404IW-DE3(S6)", "4 MP", "PTZ", "IP", "4x optical zoom", "hikvision-ds-2de2a404iw-de3-s6.webp", "IP-Products/PTZ-Cameras/Value-Series/ds-2de2a404iw-de3-s6-/"],
] as const;

export const hikvisionCameras: ProductConcept[] = products.map(([model, resolution, cameraType, connection, technology, image, path]) => ({
  slug: "hikvision-" + model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
  brand: "Hikvision",
  cameraType,
  category: "security",
  collections: ["hikvision"],
  name: text(`Hikvision ${model}`, `Hikvision ${model}`),
  description: text(`${resolution} ${connection} ${cameraType.toLowerCase()} camera. ${technology}.`, `${resolution} ${connection} ${cameraType} ক্যামেরা। ${technology}।`),
  illustration: "camera",
  images: [{ src: `/images/products/cctv/${image}`, alt: text(`Hikvision ${model} product photograph`, `Hikvision ${model} ক্যামেরার পণ্যের ছবি`), kind: "verified" }],
  specifications: [
    { label: text("Model", "মডেল"), value: text(model, model) },
    { label: text("Camera type", "ক্যামেরার ধরন"), value: text(`${connection} ${cameraType}`, `${connection} ${cameraType}`) },
    { label: text("Resolution", "রেজল্যুশন"), value: text(resolution, resolution) },
    { label: text("Key feature", "মূল বৈশিষ্ট্য"), value: text(technology, technology) },
  ],
  manufacturerUrl: "https://www.hikvision.com/en/products/" + path,
  status: "published",
  contentKind: "verified-product",
}));

export const hikvisionImageRequests = hikvisionCameras.map((camera) => ({
  model: camera.name.en.replace("Hikvision ", ""),
  requestedFile: camera.images[0]?.src.split("/").pop() || "",
  manufacturerUrl: camera.manufacturerUrl,
  status: "Local manufacturer render",
}));
