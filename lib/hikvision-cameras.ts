import { text } from "./i18n";
import type { ProductConcept } from "./public-content";

// Hikvision product images use third-party HTTPS URLs, not downloaded assets.
// These links can change or disallow hotlinking. Verify commercial reuse permission.
// Model-specific reference photos were matched to the listed products on 2026-11-23.
const network = "IP-Products/Network-Cameras/Pro-Series-EasyIP-/";
const turbo = "Turbo-HD-Products/Turbo-HD-Cameras/smart-hybrid-light-series/";

const models = [
  {
    model: "DS-2CD2043G2-I(U)", resolution: "4 MP",
    type: "AcuSense IP bullet camera", typeBn: "AcuSense আইপি বুলেট ক্যামেরা",
    technology: "AcuSense", path: network + "ds-2cd2043g2-i-u-/",
    photo: "https://rimage.ripley.com.pe/home.ripley/Attachment/MKP/3278/PMP20000431330/full_image-1.jpeg",
  },
  {
    model: "DS-2CD2143G2-I(S)", resolution: "4 MP",
    type: "AcuSense IP dome camera", typeBn: "AcuSense আইপি ডোম ক্যামেরা",
    technology: "AcuSense", path: network + "ds-2cd2143g2-i-s-/",
    photo: "https://cctvexpress.co.uk/cdn/shop/files/DS-2CD2143G2-IS_2.8MM_53860ed3-a125-4660-b5e7-45c69ed480f8.webp?v=1749567538",
  },
  {
    model: "DS-2CD2047G2H-LI(U)", resolution: "4 MP",
    type: "Smart Hybrid Light IP bullet camera", typeBn: "স্মার্ট হাইব্রিড লাইট আইপি বুলেট ক্যামেরা",
    technology: "ColorVu / Smart Hybrid Light", path: network + "ds-2cd2047g2h-li-u-/",
    photo: "https://hikvision.az/wp-content/uploads/2024/02/%E7%AD%92%E6%9C%BA91-%E6%B5%B7%E5%A4%96-%E5%8F%B3%E9%9D%A2-%E6%97%A0mic.png.thumb_.1280.1280.webp",
  },
  {
    model: "DS-2CD2387G2H-LI(U)", resolution: "8 MP",
    type: "ColorVu IP turret camera", typeBn: "ColorVu আইপি টারেট ক্যামেরা",
    technology: "ColorVu / Smart Hybrid Light", path: network + "ds-2cd2387g2h-li-u-/",
    photo: "https://i.ebayimg.com/images/g/6nQAAOSw9Ytnc8~f/s-l1200.jpg",
  },
  {
    model: "DS-2CE16D0T-LPFS", resolution: "2 MP",
    type: "Turbo HD mini bullet camera", typeBn: "টার্বো এইচডি মিনি বুলেট ক্যামেরা",
    technology: "Smart Hybrid Light", path: turbo + "ds-2ce16d0t-lpfs/",
    photo: "https://hikvision.az/wp-content/uploads/2023/04/%E7%AD%92%E6%9C%BA62.thumb_.1280.1280.png",
  },
  {
    model: "DS-2CE76D0T-LPFS", resolution: "2 MP",
    type: "Turbo HD turret camera", typeBn: "টার্বো এইচডি টারেট ক্যামেরা",
    technology: "Smart Hybrid Light", path: turbo + "ds-2ce76d0t-lpfs/",
    photo: "https://hikvision.az/wp-content/uploads/2023/04/%E6%B5%B7%E8%9E%BA29-%E5%8F%8C%E5%85%89-%E5%8F%B3%E4%BE%A7%E5%9B%BE.thumb_.1280.1280-1.png",
  },
] as const;

export const hikvisionCameras: ProductConcept[] = models.map(({ model, resolution, type, typeBn, technology, path, photo }) => ({
  slug: "hikvision-" + model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
  brand: "Hikvision",
  category: "security",
  collections: ["hikvision"],
  name: text(`Hikvision ${model}`, `Hikvision ${model}`),
  description: text(`${resolution} ${type}. ${technology}.`, `${resolution} ${typeBn}। ${technology}।`),
  illustration: "camera",
  images: [{
    src: photo,
    alt: text(`Hikvision ${model} camera product photograph`, `Hikvision ${model} ক্যামেরার পণ্যের ছবি`),
    kind: "verified",
  }],
  specifications: [
    { label: text("Model family", "মডেল পরিবার"), value: text(model, model) },
    { label: text("Camera type", "ক্যামেরার ধরন"), value: text(type, typeBn) },
    { label: text("Resolution", "রেজল্যুশন"), value: text(resolution, resolution) },
    { label: text("Technology", "প্রযুক্তি"), value: text(technology, technology) },
  ],
  manufacturerUrl: "https://www.hikvision.com/en/products/" + path,
  status: "published",
  contentKind: "verified-product",
}));

// Retain the existing named export for compatibility with other project files.
export const hikvisionImageRequests = hikvisionCameras.map((camera) => ({
  model: camera.name.en.replace("Hikvision ", ""),
  requestedFile: `${camera.slug}.webp`,
  manufacturerUrl: camera.manufacturerUrl,
  status: "Online image link mapped; usage permission and link availability must be confirmed",
}));
