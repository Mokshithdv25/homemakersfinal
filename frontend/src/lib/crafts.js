import {
  Sparkles,
  Building2,
  Wrench,
  DraftingCompass,
  Armchair,
  ConstructionIcon,
  Hammer,
  PaintBucket,
  Zap,
  Droplets,
} from "lucide-react";

export const CRAFTS = {
  design: {
    label: "Design Professionals",
    icon: Sparkles,
    items: [
      {
        id: "architect",
        name: "Architect",
        tagline: "Designing spaces that inspire.",
        Icon: DraftingCompass,
        tint: "#FBE5D4",
        iconColor: "#C85F2B",
        hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Residential", "Commercial", "Sustainable", "Urban Design", "Landscape", "Interior Architecture", "Renovation"],
      },
      {
        id: "designer",
        name: "Designer",
        tagline: "Crafting beautiful interiors.",
        Icon: Armchair,
        tint: "#F1EBE3",
        iconColor: "#8B7E6E",
        hero: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Interior", "Styling", "Space Planning", "Furniture Design", "Lighting Design", "Color Consultation"],
      },
      {
        id: "engineer",
        name: "Engineer",
        tagline: "Building with precision.",
        Icon: Building2,
        tint: "#E6EBF1",
        iconColor: "#4A6B8B",
        hero: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Structural", "MEP", "Civil", "Environmental", "Geotechnical", "Transportation"],
      },
    ],
  },
  build: {
    label: "Build Professionals",
    icon: Building2,
    items: [
      {
        id: "contractor",
        name: "Contractor",
        tagline: "Managing projects. Delivering results.",
        Icon: ConstructionIcon,
        tint: "#FDF0D8",
        iconColor: "#D4A64A",
        hero: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=70",
        specialties: ["General Contracting", "Project Management", "Renovation", "New Construction", "Remodeling"],
        wide: true,
      },
    ],
  },
  trades: {
    label: "Skilled Trades",
    icon: Wrench,
    items: [
      {
        id: "plumber",
        name: "Plumber",
        tagline: "Pipes, fittings & water systems.",
        Icon: Droplets,
        tint: "#E9EEF3",
        iconColor: "#5A7B93",
        hero: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Residential Plumbing", "Fixtures", "Water Heaters", "Pipe Repair", "Drain Cleaning"],
      },
      {
        id: "electrician",
        name: "Electrician",
        tagline: "Powering safe connections.",
        Icon: Zap,
        tint: "#FDF0D8",
        iconColor: "#E8A84A",
        hero: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1400&q=70",
        specialties: ["House Wiring", "Fuse Box / DB Setup", "Lighting Solutions", "Ceiling Fans", "Appliance Repair", "Inverter & UPS", "CCTV & Security", "Generator Installation", "Earthing & Grounding", "Smart Home Integration", "Electrical Inspection"],
      },
      {
        id: "painter",
        name: "Painter",
        tagline: "Finishes that bring life.",
        Icon: PaintBucket,
        tint: "#FBE5D4",
        iconColor: "#C85F2B",
        hero: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Interior", "Exterior", "Finishes", "Wallpaper", "Cabinet Painting"],
      },
      {
        id: "carpenter",
        name: "Carpenter",
        tagline: "Precision in every detail.",
        Icon: Hammer,
        tint: "#F1EBE3",
        iconColor: "#8B5E3C",
        hero: "https://images.unsplash.com/photo-1601058272477-3cf8edbb8a51?auto=format&fit=crop&w=1400&q=70",
        specialties: ["Framing", "Cabinetry", "Custom Millwork", "Furniture Repair", "Decking"],
      },
    ],
  },
};

export const ALL_CRAFTS = [
  ...CRAFTS.design.items,
  ...CRAFTS.build.items,
  ...CRAFTS.trades.items,
];

export const findCraft = (id) => ALL_CRAFTS.find((c) => c.id === id);
