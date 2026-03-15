import type { LucideIcon } from "lucide-react";
import {
  Type,
  Hash,
  Calendar,
  Link2,
  FileText,
  AtSign,
  Lock,
  ListOrdered,
  Fingerprint,
  ImageIcon,
  Braces,
  ToggleRight,
  Clock,
  Layers,
  Puzzle,
} from "lucide-react";

export interface FieldTypeOption {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

export const FIELD_TYPES: FieldTypeOption[] = [
  { id: "string", name: "Text", desc: "Small or long text like title or description", icon: Type, color: "bg-blue-500/10 text-blue-500" },
  { id: "richtext", name: "Rich text (Blocks)", desc: "JSON-based rich text editor", icon: FileText, color: "bg-indigo-500/10 text-indigo-500" },
  { id: "integer", name: "Number", desc: "Numbers (integer, float, decimal)", icon: Hash, color: "bg-purple-500/10 text-purple-500" },
  { id: "date", name: "Date", desc: "A date picker with hours, minutes and seconds", icon: Calendar, color: "bg-teal-500/10 text-teal-500" },
  { id: "media", name: "Media", desc: "Files like images, videos, etc.", icon: ImageIcon, color: "bg-yellow-500/10 text-yellow-500" },
  { id: "relation", name: "Relation", desc: "Refers to a Collection schema", icon: Link2, color: "bg-sky-500/10 text-sky-500" },
  { id: "text", name: "Rich text (Markdown)", desc: "The classic rich text editor", icon: FileText, color: "bg-blue-400/10 text-blue-400" },
  { id: "json", name: "JSON", desc: "Data in JSON format", icon: Braces, color: "bg-orange-500/10 text-orange-500" },
  { id: "email", name: "Email", desc: "Email field with validation format", icon: AtSign, color: "bg-green-500/10 text-green-500" },
  { id: "password", name: "Password", desc: "Password field with encryption", icon: Lock, color: "bg-red-500/10 text-red-500" },
  { id: "enumeration", name: "Enumeration", desc: "List of values, then pick one", icon: ListOrdered, color: "bg-blue-500/10 text-blue-500" },
  { id: "uid", name: "UID", desc: "Unique identifier", icon: Fingerprint, color: "bg-emerald-500/10 text-emerald-500" },
  { id: "boolean", name: "Boolean", desc: "Yes or no, 1 or 0, true or false", icon: ToggleRight, color: "bg-amber-500/10 text-amber-500" },
  { id: "float", name: "Float", desc: "Floating point number (decimal)", icon: Hash, color: "bg-purple-400/10 text-purple-400" },
  { id: "decimal", name: "Decimal", desc: "Exact decimal number", icon: Hash, color: "bg-violet-500/10 text-violet-500" },
  { id: "biginteger", name: "Big Integer", desc: "Very large integer number", icon: Hash, color: "bg-fuchsia-500/10 text-fuchsia-500" },
  { id: "datetime", name: "DateTime", desc: "Full date and time value", icon: Clock, color: "bg-teal-400/10 text-teal-400" },
  { id: "time", name: "Time", desc: "Time only (hours, minutes, seconds)", icon: Clock, color: "bg-cyan-500/10 text-cyan-500" },
  { id: "component", name: "Component", desc: "Group of fields that you can repeat or reuse", icon: Layers, color: "bg-yellow-600/10 text-yellow-600" },
  { id: "dynamiczone", name: "Dynamic zone", desc: "Dynamically pick component when editing content", icon: Puzzle, color: "bg-purple-600/10 text-purple-600" },
];

export const SCHEMA_BUILDER_SECTIONS = ["collections", "singles", "components", "dynamiczones"] as const;
export type SchemaBuilderSection = (typeof SCHEMA_BUILDER_SECTIONS)[number];
