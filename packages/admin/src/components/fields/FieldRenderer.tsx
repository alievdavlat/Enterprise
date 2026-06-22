"use client";

import { useState, useEffect } from "react";
import {
  Input,
  PasswordInput,
  Label,
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Modal,
  Badge,
} from "@enterprise/design-system";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { getImageUrl } from "@/utils/media";
import { isImageMime } from "@/utils/media";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Puzzle,
  ImageIcon,
  FileIcon,
  FileArchive,
  FileVideo,
  FileAudio,
  FileText,
  Link2,
  Search,
  GripVertical,
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";
import { JsonField } from "./JsonField";
import { BooleanField } from "./BooleanField";
import { MediaPreviewGrid } from "./MediaPreviewGrid";

import {
  type FieldRendererProps,
  ComponentFieldRenderer,
  DynamicZoneFieldRenderer,
  RelationFieldRenderer,
  MediaFieldRenderer,
} from "./field-renderers";

export function FieldRenderer({
  field,
  config,
  value,
  onChange,
  showRequired = false,
  gridSpan = "default",
}: FieldRendererProps) {
  const val = value;
  const set = onChange;

  return (
    <div
      className={cn(
        "space-y-2",
        (gridSpan === "full" || config.type === "relation") && "col-span-full",
      )}>
      <Label className="font-semibold flex items-center gap-1">
        <span className="capitalize">{field}</span>
        {showRequired && config.required && (
          <span className="text-destructive" aria-label="Required">
            *
          </span>
        )}
      </Label>

      {config.type === "boolean" ? (
        <BooleanField
          value={val}
          onChange={set}
          nullable={config.required !== true}
        />
      ) : config.type === "richtext" ? (
        <TiptapEditor
          value={typeof val === "string" ? val : ""}
          onChange={set}
          placeholder={`Enter ${field}...`}
        />
      ) : config.type === "text" ? (
        <textarea
          className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-y"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
        />
      ) : config.type === "component" ? (
        <ComponentFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : config.type === "dynamiczone" ? (
        <DynamicZoneFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : config.type === "json" ? (
        <JsonField value={val} onChange={set} />
      ) : config.type === "enumeration" && Array.isArray(config.enum) ? (
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={`Select value...`} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {config.enum.map((v: string) => (
                <SelectItem value={v}>{v}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : config.type === "password" ? (
        <PasswordInput
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      ) : config.type === "email" ? (
        <Input
          type="email"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder="name@example.com"
          className="max-w-md h-11"
        />
      ) : config.type === "date" ? (
        <Input
          type="date"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          className="max-w-md h-11"
        />
      ) : config.type === "datetime" ? (
        <Input
          type="datetime-local"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          className="max-w-md h-11"
        />
      ) : config.type === "time" ? (
        <Input
          type="time"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          className="max-w-md h-11"
        />
      ) : config.type === "integer" || config.type === "biginteger" ? (
        <Input
          type="number"
          step="1"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      ) : config.type === "float" || config.type === "decimal" ? (
        <Input
          type="number"
          step="any"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      ) : config.type === "relation" ? (
        <RelationFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : config.type === "media" ? (
        <MediaFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : (
        <Input
          type="text"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      )}
    </div>
  );
}
