import { text, type Localized } from "./i18n";
import { type BrandingSettings } from "./branding";
import { companySettings } from "./business/company-settings";

export type PublishStatus = "draft" | "published";
export type Media = {
  src: string;
  alt: Localized;
  kind: "concept" | "verified";
};
// Stable content IDs stay open to CMS-created categories and child categories.
export type CategoryId = string;
export type SolutionCategory = {
  id: CategoryId;
  name: Localized;
  description: Localized;
  children?: SolutionCategory[];
};
export type ProductConcept = {
  slug: string;
  category: CategoryId;
  name: Localized;
  description: Localized;
  illustration:
    | "linear"
    | "halo"
    | "lock"
    | "switch"
    | "sensor"
    | "camera"
    | "speaker"
    | "outdoor"
    | "network";
  images: Media[];
  specifications: { label: Localized; value: Localized }[];
  status: PublishStatus;
  contentKind: "concept" | "verified-product";
  collections?: ("featured" | "new-arrivals" | "new-designs")[];
};
export type Service = {
  slug: string;
  name: Localized;
  description: Localized;
  scope: Localized[];
  areas: CategoryId[];
  image: Media;
  status: PublishStatus;
};
export type PortfolioProject = {
  slug: string;
  name: Localized;
  category: Localized;
  location: Localized | null;
  cover: Media;
  gallery: Media[];
  description: Localized;
  areas: CategoryId[];
  status: PublishStatus;
  contentKind: "concept" | "completed-project";
};
export type Job = {
  slug: string;
  title: Localized;
  team: Localized;
  location: Localized;
  description: Localized;
  responsibilities: Localized[];
  requirements: Localized[];
  status: PublishStatus;
  applicationsOpen: boolean;
};

// Public allowlist only. Never put acquisition costs, selling prices, credentials,
// customer records, or internal product fields in this module or client props.
export type SiteSettings = {
  name: string;
  country: Localized;
  contact: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    whatsappMessage: Localized;
    address: Localized | null;
  };
  socialLinks: { facebookUrl: string | null; instagramUrl: string | null; youtubeUrl: string | null; linkedinUrl: string | null };
  social: {
    network: "facebook" | "linkedin" | "instagram" | "youtube" | "other";
    label: string;
    url: string;
  }[];
  logos: BrandingSettings;
};
export const company: SiteSettings = companySettings;
export {navigationKeys as navigation} from './navigation';
export const media = {
  hero: {
    src: "/images/lighting-hero.webp",
    alt: text(
      "Conceptual suspended lighting installation in a charcoal architectural space",
      "চারকোল স্থাপত্যের পরিসরে ঝুলন্ত আলোকসজ্জার ধারণাভিত্তিক দৃশ্য",
    ),
    kind: "concept",
  },
  home: {
    src: "/images/residential-concept.webp",
    alt: text(
      "Residential design concept with warm lighting and natural materials",
      "উষ্ণ আলো ও প্রাকৃতিক উপকরণে আবাসিক নকশার ধারণা",
    ),
    kind: "concept",
  },
  commercial: {
    src: "/images/hospitality-concept.webp",
    alt: text(
      "Hospitality design concept with pendant lighting over a stone counter",
      "পাথরের কাউন্টারের ওপর ঝুলন্ত আলোসহ আতিথেয়তা স্থাপনার নকশার ধারণা",
    ),
    kind: "concept",
  },
} satisfies Record<string, Media>;

export const categories: SolutionCategory[] = [
  {
    id: "lighting",
    name: text("Lighting", "আলোকসজ্জা"),
    description: text(
      "Architectural and decorative light for everyday spaces.",
      "প্রতিদিনের পরিসরে স্থাপত্যভিত্তিক ও আলংকারিক আলো।",
    ),
  },
  {
    id: "automation",
    name: text("Smart home automation", "স্মার্ট হোম অটোমেশন"),
    description: text(
      "Consider connected control around your routines.",
      "আপনার দৈনন্দিন অভ্যাস অনুযায়ী সংযুক্ত নিয়ন্ত্রণের পরিকল্পনা।",
    ),
  },
  {
    id: "access",
    name: text("Smart door locks", "স্মার্ট দরজার লক"),
    description: text(
      "Explore access options suited to your doors.",
      "আপনার দরজার উপযোগী প্রবেশব্যবস্থার ধারণা।",
    ),
  },
  {
    id: "switches",
    name: text("Switches & sockets", "সুইচ ও সকেট"),
    description: text(
      "Plan convenient controls and power points.",
      "সুবিধাজনক নিয়ন্ত্রণ ও বিদ্যুৎ সংযোগের পরিকল্পনা।",
    ),
  },
  {
    id: "sensors",
    name: text("Sensors & control", "সেন্সর ও নিয়ন্ত্রণ"),
    description: text(
      "Discuss sensing and control requirements.",
      "সেন্সর ও নিয়ন্ত্রণব্যবস্থার প্রয়োজন নিয়ে আলোচনা।",
    ),
  },
  {
    id: "security",
    name: text("CCTV & security", "CCTV ও নিরাপত্তা"),
    description: text(
      "A considered view of surveillance and coverage.",
      "নজরদারি ও কভারেজের সুচিন্তিত পরিকল্পনা।",
    ),
  },
  {
    id: "audio",
    name: text("Audio & entertainment", "অডিও ও বিনোদন"),
    description: text(
      "Explore wireless audio and entertainment setups.",
      "তারবিহীন অডিও ও বিনোদনব্যবস্থার ধারণা।",
    ),
  },
  {
    id: "outdoor",
    name: text("Outdoor & maintenance", "বহিরাঙ্গন ও রক্ষণাবেক্ষণ"),
    description: text(
      "Plan outdoor systems and ongoing care.",
      "বহিরাঙ্গন ব্যবস্থা ও নিয়মিত যত্নের পরিকল্পনা।",
    ),
  },
  {
    id: "digital",
    name: text("Digital & commercial", "ডিজিটাল ও বাণিজ্যিক"),
    description: text(
      "Connected infrastructure for home and work.",
      "বাসা ও কর্মস্থলের জন্য সংযুক্ত অবকাঠামো।",
    ),
  },
];

// Category previews are independent of product inventory and product imagery.
export const solutionPreviews = [
  { id: "lighting", icon: "spark", name: text("Lighting Solutions", "আলোকসজ্জা সমাধান"), description: text("Architectural and decorative light for your space.", "আপনার পরিসরের জন্য স্থাপত্যভিত্তিক ও আলংকারিক আলো।") },
  { id: "automation", icon: "layers", name: text("Smart Home Automation", "স্মার্ট হোম অটোমেশন"), description: text("Connected comfort, shaped around everyday routines.", "দৈনন্দিন অভ্যাসের সঙ্গে মানানসই সংযুক্ত নিয়ন্ত্রণ।") },
  { id: "access", icon: "lock", name: text("Smart Door Locks", "স্মার্ট দরজার লক"), description: text("Thoughtful access for homes and workplaces.", "বাসা ও কর্মস্থলের জন্য সুচিন্তিত প্রবেশব্যবস্থা।") },
  { id: "switches", icon: "controls", name: text("Switches & Sockets", "সুইচ ও সকেট"), description: text("Refined controls and practical power points.", "পরিশীলিত নিয়ন্ত্রণ ও সুবিধাজনক বিদ্যুৎ সংযোগ।") },
  { id: "security", icon: "camera", name: text("CCTV & Security", "CCTV ও নিরাপত্তা"), description: text("Plan visibility, coverage, and peace of mind.", "নজরদারি, কভারেজ ও নিরাপত্তার পরিকল্পনা।") },
  { id: "audio-digital", icon: "audio", name: text("Audio & Digital Solutions", "অডিও ও ডিজিটাল সমাধান"), description: text("Sound, connectivity, and digital essentials.", "অডিও, সংযোগ ও প্রয়োজনীয় ডিজিটাল ব্যবস্থা।") },
] as const;

export const productConcepts: ProductConcept[] = [
  {
    slug: "architectural-lighting",
    collections: ["featured"],
    category: "lighting",
    name: text("Architectural lighting", "স্থাপত্যভিত্তিক আলোকসজ্জা"),
    description: text(
      "Linear and ambient lighting concepts that work with the architecture.",
      "স্থাপত্যের সঙ্গে সামঞ্জস্যপূর্ণ সরলরেখার ও পরিবেশভিত্তিক আলোর ধারণা।",
    ),
    illustration: "linear",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "decorative-lighting",
    category: "lighting",
    name: text("Decorative lighting", "আলংকারিক আলোকসজ্জা"),
    description: text(
      "Explore pendant forms and a focal point for your room.",
      "ঝুলন্ত আলোর আকার ও ঘরের আকর্ষণীয় কেন্দ্রবিন্দুর ধারণা।",
    ),
    illustration: "halo",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "connected-home",
    category: "automation",
    name: text("Connected home control", "সংযুক্ত হোম নিয়ন্ত্রণ"),
    description: text(
      "Plan how lighting, controls, and daily routines could work together. Compatibility needs assessment.",
      "আলো, নিয়ন্ত্রণ ও দৈনন্দিন কাজ একসঙ্গে পরিচালনার পরিকল্পনা। সামঞ্জস্য যাচাই প্রয়োজন।",
    ),
    illustration: "switch",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "smart-door-access",
    collections: ["featured"],
    category: "access",
    name: text("Smart door access", "স্মার্ট দরজার প্রবেশব্যবস্থা"),
    description: text(
      "An access-control concept. Door suitability and access methods require confirmation.",
      "প্রবেশ নিয়ন্ত্রণের ধারণা। দরজার উপযোগিতা ও প্রবেশের পদ্ধতি নিশ্চিত করতে হবে।",
    ),
    illustration: "lock",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "smart-switches",
    category: "switches",
    name: text("Smart switches & sockets", "স্মার্ট সুইচ ও সকেট"),
    description: text(
      "Consider switch placement, finish, and circuit requirements with your project team.",
      "আপনার প্রকল্প দলের সঙ্গে সুইচের অবস্থান, ফিনিশ ও সার্কিটের চাহিদা বিবেচনা করুন।",
    ),
    illustration: "switch",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "sensors-and-controls",
    category: "sensors",
    name: text("Sensors & control systems", "সেন্সর ও নিয়ন্ত্রণব্যবস্থা"),
    description: text(
      "Explore sensing needs and possible control scenarios for your space.",
      "আপনার পরিসরের সেন্সর ও নিয়ন্ত্রণের সম্ভাব্য ব্যবহার নিয়ে আলোচনা করুন।",
    ),
    illustration: "sensor",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "surveillance-planning",
    collections: ["featured"],
    category: "security",
    name: text("CCTV & surveillance", "CCTV ও নজরদারি"),
    description: text(
      "Explore camera placement, privacy, recording needs, and site coverage.",
      "ক্যামেরার অবস্থান, গোপনীয়তা, রেকর্ডিং ও স্থানের কভারেজ নিয়ে পরিকল্পনা।",
    ),
    illustration: "camera",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "wireless-audio",
    category: "audio",
    name: text("Wireless audio", "তারবিহীন অডিও"),
    description: text(
      "Discuss room layout, listening needs, and a suitable entertainment setup.",
      "ঘরের বিন্যাস, শোনার প্রয়োজন ও উপযুক্ত বিনোদনব্যবস্থা নিয়ে আলোচনা।",
    ),
    illustration: "speaker",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "outdoor-solutions",
    category: "outdoor",
    name: text("Outdoor solutions", "বহিরাঙ্গনের সমাধান"),
    description: text(
      "Consider outdoor lighting, site conditions, and maintenance needs. Suitability must be verified.",
      "বাইরের আলো, স্থানের পরিবেশ ও রক্ষণাবেক্ষণের চাহিদা বিবেচনা করুন। উপযোগিতা যাচাই করতে হবে।",
    ),
    illustration: "outdoor",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "digital-setup",
    category: "digital",
    name: text(
      "Home & commercial digital setup",
      "বাসা ও বাণিজ্যিক ডিজিটাল সেটআপ",
    ),
    description: text(
      "Plan connectivity, device placement, and practical digital requirements for your space.",
      "আপনার পরিসরের সংযোগ, যন্ত্রপাতির অবস্থান ও বাস্তব ডিজিটাল চাহিদার পরিকল্পনা।",
    ),
    illustration: "network",
    images: [],
    specifications: [],
    status: "published",
    contentKind: "concept",
  },
];

export const publicServices: Service[] = [
  {
    slug: "lighting-design",
    name: text("Lighting planning & design", "আলোকসজ্জার পরিকল্পনা ও নকশা"),
    description: text(
      "Consider ambient, task, and accent light around the architecture and how the space is used.",
      "স্থাপত্য ও ব্যবহারের ধরন অনুযায়ী পরিবেশ, কাজ ও বিশেষ অংশের আলো বিবেচনা করা।",
    ),
    scope: [
      text("Room use and lighting direction", "ঘরের ব্যবহার ও আলোর ধরন"),
      text(
        "Fixture placement and design coordination",
        "আলোর অবস্থান ও নকশার সমন্বয়",
      ),
    ],
    areas: ["lighting", "outdoor"],
    image: media.home,
    status: "published",
  },
  {
    slug: "smart-systems",
    name: text("Smart systems consultation", "স্মার্ট ব্যবস্থা নিয়ে পরামর্শ"),
    description: text(
      "Define automation, access, and control requirements before selecting compatible systems.",
      "সামঞ্জস্যপূর্ণ ব্যবস্থা বেছে নেওয়ার আগে অটোমেশন, প্রবেশ ও নিয়ন্ত্রণের চাহিদা নির্ধারণ।",
    ),
    scope: [
      text(
        "Routine and control requirements",
        "দৈনন্দিন ব্যবহার ও নিয়ন্ত্রণের চাহিদা",
      ),
      text(
        "Compatibility and installation review",
        "সামঞ্জস্য ও স্থাপনের বিষয় পর্যালোচনা",
      ),
    ],
    areas: ["automation", "access", "switches", "sensors"],
    image: media.home,
    status: "published",
  },
  {
    slug: "security-planning",
    name: text(
      "Security & surveillance planning",
      "নিরাপত্তা ও নজরদারি পরিকল্পনা",
    ),
    description: text(
      "Discuss site coverage, access, privacy, and recording requirements for homes and businesses.",
      "বাসা ও ব্যবসার কভারেজ, প্রবেশ, গোপনীয়তা ও রেকর্ডিংয়ের প্রয়োজন নিয়ে আলোচনা।",
    ),
    scope: [
      text(
        "Site and camera coverage review",
        "স্থান ও ক্যামেরার কভারেজ পর্যালোচনা",
      ),
      text(
        "Privacy, access, and recording requirements",
        "গোপনীয়তা, প্রবেশ ও রেকর্ডিংয়ের চাহিদা",
      ),
    ],
    areas: ["security", "access"],
    image: media.commercial,
    status: "published",
  },
  {
    slug: "connected-spaces",
    name: text(
      "Audio, connectivity & digital setup",
      "অডিও, সংযোগ ও ডিজিটাল সেটআপ",
    ),
    description: text(
      "Bring room layout, entertainment, and connectivity needs into a practical project brief.",
      "ঘরের বিন্যাস, বিনোদন ও সংযোগের চাহিদা নিয়ে বাস্তবসম্মত প্রকল্পের বিবরণ তৈরি।",
    ),
    scope: [
      text("Room and device layout", "ঘর ও যন্ত্রপাতির বিন্যাস"),
      text("Connectivity and system coordination", "সংযোগ ও ব্যবস্থার সমন্বয়"),
    ],
    areas: ["audio", "digital"],
    image: media.commercial,
    status: "published",
  },
  {
    slug: "project-support",
    name: text(
      "Project coordination & ongoing care",
      "প্রকল্পের সমন্বয় ও নিয়মিত যত্ন",
    ),
    description: text(
      "Discuss product selection, installation coordination, outdoor needs, and a suitable maintenance scope.",
      "পণ্য নির্বাচন, স্থাপনের সমন্বয়, বহিরাঙ্গনের চাহিদা ও উপযুক্ত রক্ষণাবেক্ষণ নিয়ে আলোচনা।",
    ),
    scope: [
      text(
        "Selection and installation coordination",
        "নির্বাচন ও স্থাপনের সমন্বয়",
      ),
      text(
        "Maintenance requirements and agreed support",
        "রক্ষণাবেক্ষণের চাহিদা ও নির্ধারিত সহায়তা",
      ),
    ],
    areas: ["outdoor", "digital", "lighting"],
    image: media.hero,
    status: "published",
  },
];
export const portfolio: PortfolioProject[] = [
  {
    slug: "residential-concept",
    name: text("A considered home", "সুচিন্তিত আবাসিক পরিসর"),
    category: text("Residential concept", "আবাসিক নকশার ধারণা"),
    location: null,
    cover: media.home,
    gallery: [media.home],
    description: text(
      "An original visual concept exploring warm light, natural materials, and a comfortable residential atmosphere. No installation or completed work is claimed.",
      "উষ্ণ আলো, প্রাকৃতিক উপকরণ ও স্বাচ্ছন্দ্যময় আবাসিক পরিবেশের মৌলিক নকশার ধারণা। এটি স্থাপিত বা সম্পন্ন কাজ নয়।",
    ),
    areas: ["lighting", "automation", "audio"],
    status: "published",
    contentKind: "concept",
  },
  {
    slug: "commercial-concept",
    name: text("An inviting commercial space", "স্বাগত জানানো বাণিজ্যিক পরিসর"),
    category: text("Hospitality concept", "আতিথেয়তা স্থাপনার ধারণা"),
    location: null,
    cover: media.commercial,
    gallery: [media.commercial],
    description: text(
      "An original hospitality visual concept exploring atmosphere, material, and light. It illustrates a design direction, not an AIA client project.",
      "পরিবেশ, উপকরণ ও আলোর সমন্বয়ে আতিথেয়তা স্থাপনার মৌলিক নকশার ধারণা। এটি AIA-এর গ্রাহকের প্রকল্প নয়।",
    ),
    areas: ["lighting", "security", "digital"],
    status: "published",
    contentKind: "concept",
  },
];
export const jobs: Job[] = [];
