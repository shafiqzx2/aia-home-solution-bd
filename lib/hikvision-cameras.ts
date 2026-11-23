import { text } from "./i18n";
import type { ProductConcept } from "./public-content";

// Verified against the linked manufacturer pages on 2026-11-23.
// Official photos are NOT licensed to AIA by merely being publicly downloadable.
// Each model below still needs its own matching photo and commercial reuse permission.
// No generic camera artwork or another model's photo may stand in for that asset.
const network = "IP-Products/Network-Cameras/Pro-Series-EasyIP-/";
const ptz = "IP-Products/PTZ-Cameras/";
const turbo = "Turbo-HD-Products/Turbo-HD-Cameras/smart-hybrid-light-series/";
const models = [
  ["DS-2CD2043G2-I(U)", "4 MP", "IP bullet camera", "আইপি বুলেট ক্যামেরা", "AcuSense", network + "ds-2cd2043g2-i-u-/"],
  ["DS-2CD2143G2-I(S)", "4 MP", "IP dome camera", "আইপি ডোম ক্যামেরা", "AcuSense", network + "ds-2cd2143g2-i-s-/"],
  ["DS-2CD2343G2-I(U)", "4 MP", "IP turret camera", "আইপি টারেট ক্যামেরা", "AcuSense", network + "ds-2cd2343g2-i-u-/"],
  ["DS-2CD2086G2-I(U)", "4K", "IP mini bullet camera", "আইপি মিনি বুলেট ক্যামেরা", "AcuSense", network + "ds-2cd2086g2-i-u-/"],
  ["DS-2CD2386G2-I(U)", "4K", "IP turret camera", "আইপি টারেট ক্যামেরা", "AcuSense", network + "ds-2cd2386g2-i-u-/"],
  ["DS-2CD2047G2H-LI(U)", "4 MP", "IP mini bullet camera", "আইপি মিনি বুলেট ক্যামেরা", "Smart Hybrid Light / ColorVu", network + "ds-2cd2047g2h-li-u-/"],
  ["DS-2CD2347G2H-LI(U)", "4 MP", "IP turret camera", "আইপি টারেট ক্যামেরা", "Smart Hybrid Light / ColorVu", network + "ds-2cd2347g2h-li-u-/"],
  ["DS-2CD2147G2H-LI(SU)", "4 MP", "IP dome camera", "আইপি ডোম ক্যামেরা", "Smart Hybrid Light / ColorVu", network + "ds-2cd2147g2h-li-su-/"],
  ["DS-2CD2387G2H-LI(U)", "8 MP", "IP turret camera", "আইপি টারেট ক্যামেরা", "Smart Hybrid Light / ColorVu", network + "ds-2cd2387g2h-li-u-/"],
  ["DS-2CD2047G2-L(U)", "4 MP", "IP mini bullet camera", "আইপি মিনি বুলেট ক্যামেরা", "ColorVu", network + "ds-2cd2047g2-l-u-/"],
  ["DS-2CD2347G2-L(U)", "4 MP", "IP turret camera", "আইপি টারেট ক্যামেরা", "ColorVu", network + "ds-2cd2347g2-l-u-/"],
  ["DS-2CD2387G2-L(U)", "8 MP", "IP turret camera", "আইপি টারেট ক্যামেরা", "ColorVu", network + "ds-2cd2387g2-l-u-/"],
  ["DS-2CD2643G2-IZS", "4 MP", "motorized varifocal IP bullet camera", "মোটরচালিত ভ্যারিফোকাল আইপি বুলেট ক্যামেরা", "AcuSense", network + "ds-2cd2643g2-izs/"],
  ["DS-2DE2A404IW-DE3(S6)", "4 MP", "mini dome PTZ network camera", "মিনি ডোম পিটিজেড নেটওয়ার্ক ক্যামেরা", "4x optical zoom", ptz + "Value-Series/ds-2de2a404iw-de3-s6-/"],
  ["DS-2DE4425IW-DE(T5)", "4 MP", "PTZ network speed dome", "পিটিজেড নেটওয়ার্ক স্পিড ডোম", "25x optical zoom", ptz + "Pro-Series/ds-2de4425iw-de-t5-/"],
  ["DS-2DE7A425IW-AEB(T5)", "4 MP", "PTZ network speed dome", "পিটিজেড নেটওয়ার্ক স্পিড ডোম", "25x optical zoom", ptz + "Pro-Series/ds-2de7a425iw-aeb-t5-/"],
  ["DS-2CE16D0T-LPFS", "2 MP", "Turbo HD mini bullet camera", "টার্বো এইচডি মিনি বুলেট ক্যামেরা", "Smart Hybrid Light", turbo + "ds-2ce16d0t-lpfs/"],
  ["DS-2CE76D0T-LPFS", "2 MP", "Turbo HD turret camera", "টার্বো এইচডি টারেট ক্যামেরা", "Smart Hybrid Light", turbo + "ds-2ce76d0t-lpfs/"],
] as const;

export const hikvisionCameras: ProductConcept[] = models.map(([model, resolution, type, typeBn, technology, path]) => ({
  slug: "hikvision-" + model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
  brand: "Hikvision", category: "security", collections: ["hikvision"],
  name: text(`Hikvision ${model}`, `Hikvision ${model}`),
  description: text(`${resolution} ${type}. ${technology}.`, `${resolution} ${typeBn}। ${technology}।`),
  illustration: "camera", images: [],
  specifications: [
    { label: text("Model family", "মডেল পরিবার"), value: text(model, model) },
    { label: text("Camera type", "ক্যামেরার ধরন"), value: text(type, typeBn) },
    { label: text("Resolution", "রেজল্যুশন"), value: text(resolution, resolution) },
    { label: text("Technology", "প্রযুক্তি"), value: text(technology, technology) },
  ],
  manufacturerUrl: "https://www.hikvision.com/en/products/" + path,
  status: "published", contentKind: "verified-product",
}));

// This is the specific outstanding image list: 18 distinct, matching photos.
// Manufacturer URLs identify the exact product family to request from the supplier.
export const hikvisionImageRequests = hikvisionCameras.map(camera => ({
  model: camera.name.en.replace("Hikvision ", ""),
  requestedFile: `${camera.slug}.webp`,
  manufacturerUrl: camera.manufacturerUrl,
  status: "Matching product photo and AIA commercial reuse permission required",
}));
