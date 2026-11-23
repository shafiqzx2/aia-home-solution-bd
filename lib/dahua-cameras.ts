import { text } from "./i18n";
import type { ProductConcept } from "./public-content";

const products = [
  ["IPC-HFW2449TL-S-PROX", "4 MP", "Bullet", "IP", "WizColor X", "dahua-ipc-hfw2449tl-s-prox.webp", "network-products/network-cameras/wizsense-2-series/wizcolor/ipc-hfw2449tl-s-prox"],
  ["IPC-HDW2449TH-S-PROX", "4 MP", "Turret", "IP", "WizColor X", "dahua-ipc-hdw2449th-s-prox.webp", "network-products/network-cameras/wizsense-2-series/wizcolor/ipc-hdw2449th-s-prox"],
  ["IPC-HFW3849T1-AS-PV-PRO", "8 MP", "Bullet", "IP", "WizColor TiOC PRO", "dahua-ipc-hfw3849t1-as-pv-pro.webp", "network-products/network-cameras/wizsense-3-series/tioc-pro-wizcolor/ipc-hfw3849t1-as-pv-pro"],
  ["IPC-HDW3849H-AS-PV-PRO", "8 MP", "Turret", "IP", "WizColor TiOC PRO", "dahua-ipc-hdw3849h-as-pv-pro.webp", "network-products/network-cameras/wizsense-3-series/tioc-pro-wizcolor/ipc-hdw3849h-as-pv-pro"],
] as const;

export const dahuaCameras: ProductConcept[] = products.map(([model, resolution, cameraType, connection, technology, image, path]) => ({
  slug: "dahua-" + model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
  brand: "Dahua",
  cameraType,
  category: "security",
  name: text(`Dahua ${model}`, `Dahua ${model}`),
  description: text(`${resolution} ${connection} ${cameraType.toLowerCase()} camera. ${technology}.`, `${resolution} ${connection} ${cameraType} ক্যামেরা। ${technology}।`),
  illustration: "camera",
  images: [{ src: `/images/products/cctv/${image}`, alt: text(`Dahua ${model} product photograph`, `Dahua ${model} ক্যামেরার পণ্যের ছবি`), kind: "verified" }],
  specifications: [
    { label: text("Model", "মডেল"), value: text(model, model) },
    { label: text("Camera type", "ক্যামেরার ধরন"), value: text(`${connection} ${cameraType}`, `${connection} ${cameraType}`) },
    { label: text("Resolution", "রেজল্যুশন"), value: text(resolution, resolution) },
    { label: text("Key feature", "মূল বৈশিষ্ট্য"), value: text(technology, technology) },
  ],
  manufacturerUrl: "https://www.dahuasecurity.com/products/" + path,
  status: "published",
  contentKind: "verified-product",
}));
