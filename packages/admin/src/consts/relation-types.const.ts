import type { LucideIcon } from "lucide-react";
import { Link2, GitBranch, ArrowRightLeft, Network } from "lucide-react";

export interface RelationTypeOption {
  id: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  name: string;
  shortDesc: string;
  icon: LucideIcon;
  /** Tailwind classes for icon container */
  color: string;
  /** For "X has Y" description */
  label: string;
}

export const RELATION_TYPE_OPTIONS: RelationTypeOption[] = [
  {
    id: "oneToOne",
    name: "One to one",
    shortDesc: "One entry links to one other",
    icon: Link2,
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    label: "has one",
  },
  {
    id: "oneToMany",
    name: "One to many",
    shortDesc: "One entry has many related",
    icon: GitBranch,
    color: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    label: "has many",
  },
  {
    id: "manyToOne",
    name: "Many to one",
    shortDesc: "Many entries link to one",
    icon: ArrowRightLeft,
    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    label: "belongs to one",
  },
  {
    id: "manyToMany",
    name: "Many to many",
    shortDesc: "Many entries link to many",
    icon: Network,
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    label: "has and belongs to many",
  },
];
