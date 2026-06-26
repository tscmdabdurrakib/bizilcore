import type { BlockNode } from "../types";
import { createBlock } from "../utils/blocks";

export interface BlockPattern {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: BlockNode[];
}

export const BLOCK_PATTERNS: BlockPattern[] = [
  {
    id: "hero",
    name: "Hero Section",
    description: "Large heading with subtitle and CTA",
    category: "Marketing",
    blocks: [
      createBlock("heading", { level: 1 }),
      createBlock("paragraph"),
      createBlock("button", { label: "Get Started", url: "#", variant: "primary" }),
    ],
  },
  {
    id: "cta",
    name: "Call to Action",
    description: "Centered CTA with button",
    category: "Marketing",
    blocks: [
      createBlock("heading", { level: 2 }),
      createBlock("paragraph"),
      createBlock("button", { label: "Learn More", url: "#", variant: "secondary" }),
    ],
  },
  {
    id: "faq",
    name: "FAQ",
    description: "Question and answer pairs",
    category: "Content",
    blocks: [
      createBlock("heading", { level: 2 }),
      createBlock("heading", { level: 3 }),
      createBlock("paragraph"),
      createBlock("heading", { level: 3 }),
      createBlock("paragraph"),
    ],
  },
  {
    id: "testimonial",
    name: "Testimonial",
    description: "Customer quote block",
    category: "Social Proof",
    blocks: [
      createBlock("quote", { citation: "Happy Customer" }),
    ],
  },
];
