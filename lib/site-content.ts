export const navigation = [
  { label: "Collections", href: "/#collections" },
  { label: "Services", href: "/#services" },
  { label: "Our spaces", href: "/#spaces" },
  { label: "About us", href: "/#about" },
] as const;

export type ProductShape = "halo" | "linear" | "spot" | "wall";
export type Collection =
  | "All lighting"
  | "Architectural"
  | "Decorative"
  | "Outdoor";

export const collections = [
  {
    name: "Architectural",
    description: "Seamlessly part of your space.",
    shape: "linear",
    number: "01",
  },
  {
    name: "Decorative",
    description: "A little light. A lot of character.",
    shape: "halo",
    number: "02",
  },
  {
    name: "Outdoor",
    description: "Bring the outside to life.",
    shape: "wall",
    number: "03",
  },
] as const;

// Concept selections, not verified inventory or technical product specifications.
export const products: {
  id: string;
  name: string;
  category: Exclude<Collection, "All lighting">;
  shape: ProductShape;
  description: string;
  detail: string;
  finish: string;
}[] = [
  {
    id: "halo-pendant",
    name: "Halo pendant",
    category: "Decorative",
    shape: "halo",
    description: "A statement in perfect balance.",
    detail:
      "A sculptural ring silhouette that brings a quiet focal point to dining rooms, double-height spaces, and considered interiors.",
    finish: "Champagne-inspired metal",
  },
  {
    id: "linea-profile",
    name: "Linea profile",
    category: "Architectural",
    shape: "linear",
    description: "Clean lines. Endless possibilities.",
    detail:
      "A linear lighting concept for following architectural lines, defining circulation, and bringing an understated rhythm to a room.",
    finish: "Matte black-inspired profile",
  },
  {
    id: "focus-spotlight",
    name: "Focus spotlight",
    category: "Architectural",
    shape: "spot",
    description: "Put the details in the spotlight.",
    detail:
      "A directional lighting concept for accenting textures, artwork, and the details that make a space personal.",
    finish: "Soft black-inspired housing",
  },
  {
    id: "edge-wall-light",
    name: "Edge wall light",
    category: "Outdoor",
    shape: "wall",
    description: "Architecture, beautifully outlined.",
    detail:
      "A wall-light concept that explores gentle upward and downward illumination. Outdoor suitability and final specifications need confirmation for each project.",
    finish: "Textured graphite-inspired finish",
  },
];

export const services = [
  {
    title: "Architectural lighting design",
    description: "Light that belongs to the architecture.",
    detail:
      "We consider the way a space is used, its materials, and its proportions to shape layers of ambient, task, and accent lighting.",
    icon: "architecture",
  },
  {
    title: "Lighting consultation",
    description: "A clearer vision for your space.",
    detail:
      "Explore light placement, atmosphere, and design direction with a considered approach to your home or commercial space.",
    icon: "sun",
  },
  {
    title: "Product supply",
    description: "The right light for the right place.",
    detail:
      "Find lighting options that complement the design intent. Availability, finishes, and specifications are confirmed during consultation.",
    icon: "box",
  },
  {
    title: "Project-based support",
    description: "Thoughtful guidance along the way.",
    detail:
      "Coordinate lighting choices with the wider project and get support as a design moves from ideas toward installation.",
    icon: "layers",
  },
  {
    title: "Custom lighting solutions",
    description: "Made around your possibilities.",
    detail:
      "Discuss unusual dimensions, architectural details, and specific lighting ideas. Feasibility and scope are reviewed before any commitment.",
    icon: "spark",
  },
] as const;
