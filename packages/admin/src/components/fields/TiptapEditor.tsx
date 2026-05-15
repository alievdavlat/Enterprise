"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
  Code2,
  Minus,
  Link2,
  Link2Off,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Pilcrow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Button,
} from "@enterprise/design-system";

/**
 * Floating toolbar for the rich-text editor. Groups commands like the
 * Strapi CKEditor toolbar so the layout stays scannable.
 *
 * Sections (left → right):
 *   - History (undo / redo)
 *   - Block type (paragraph / H1-H3)
 *   - Inline marks (bold / italic / underline / strike / code)
 *   - Alignment (left / center / right / justify)
 *   - Lists / blockquote / horizontal rule / code block
 *   - Insert (link, image)
 */
function MenuBar({
  editor,
  onAskLink,
  onAskImage,
}: {
  editor: Editor | null;
  onAskLink: () => void;
  onAskImage: () => void;
}) {
  if (!editor) return null;

  const isHeading = (level: 1 | 2 | 3) =>
    editor.isActive("heading", { level });

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
      <ToolbarGroup>
        <ToolbarButton
          icon={Undo}
          title="Undo (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={Redo}
          title="Redo (Ctrl+Y)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolbarButton
          icon={Pilcrow}
          title="Paragraph"
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph") && !editor.isActive("heading")}
        />
        <ToolbarButton
          icon={Heading1}
          title="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={isHeading(1)}
        />
        <ToolbarButton
          icon={Heading2}
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={isHeading(2)}
        />
        <ToolbarButton
          icon={Heading3}
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={isHeading(3)}
        />
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolbarButton
          icon={Bold}
          title="Bold (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          icon={Italic}
          title="Italic (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          icon={UnderlineIcon}
          title="Underline (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
        />
        <ToolbarButton
          icon={Strikethrough}
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        />
        <ToolbarButton
          icon={Code}
          title="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
        />
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolbarButton
          icon={AlignLeft}
          title="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
        />
        <ToolbarButton
          icon={AlignCenter}
          title="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
        />
        <ToolbarButton
          icon={AlignRight}
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
        />
        <ToolbarButton
          icon={AlignJustify}
          title="Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
        />
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolbarButton
          icon={List}
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          icon={ListOrdered}
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        />
        <ToolbarButton
          icon={Quote}
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        />
        <ToolbarButton
          icon={Code2}
          title="Code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
        />
        <ToolbarButton
          icon={Minus}
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </ToolbarGroup>

      <Divider />

      <ToolbarGroup>
        <ToolbarButton
          icon={Link2}
          title="Add / edit link (Ctrl+K)"
          onClick={onAskLink}
          isActive={editor.isActive("link")}
        />
        {editor.isActive("link") && (
          <ToolbarButton
            icon={Link2Off}
            title="Remove link"
            onClick={() => editor.chain().focus().unsetLink().run()}
          />
        )}
        <ToolbarButton
          icon={ImageIcon}
          title="Insert image"
          onClick={onAskImage}
        />
      </ToolbarGroup>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

function ToolbarButton({
  icon: Icon,
  onClick,
  isActive,
  disabled,
  title,
}: {
  icon: LucideIcon;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive ? true : undefined}
      className={cn(
        "p-1.5 rounded-md transition-colors inline-flex items-center justify-center",
        isActive && "bg-primary/15 text-primary",
        !isActive &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

function LinkDialog({
  open,
  onOpenChange,
  initialUrl,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl: string;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  useEffect(() => {
    if (open) setUrl(initialUrl);
  }, [open, initialUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialUrl ? "Edit link" : "Add link"}</DialogTitle>
          <DialogDescription>
            Paste or type the destination URL. Use the absolute form
            (https://…) for external links.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="link-url">URL</Label>
          <Input
            id="link-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit(url);
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(url)} disabled={!url.trim()}>
            {initialUrl ? "Update" : "Add link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { src: string; alt?: string }) => void;
}) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  useEffect(() => {
    if (open) {
      setSrc("");
      setAlt("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription>
            Paste an image URL. The image will be embedded inline at the
            current cursor position.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="img-src">Image URL</Label>
            <Input
              id="img-src"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://example.com/image.png"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="img-alt">Alt text</Label>
            <Input
              id="img-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ src, alt: alt || undefined })}
            disabled={!src.trim()}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TiptapEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-2" },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write your content…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] max-h-[640px] overflow-y-auto p-4 focus:outline-none text-sm prose prose-sm dark:prose-invert max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:text-zinc-100 [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-4 [&_hr]:border-border [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_img]:rounded-lg",
      },
      handleKeyDown(view, event) {
        // Ctrl/Cmd+K opens the link dialog instead of the browser bar.
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          setLinkOpen(true);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const currentLinkUrl = editor?.getAttributes("link")?.href ?? "";

  const submitLink = (url: string) => {
    if (!editor) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    }
    setLinkOpen(false);
  };

  const submitImage = ({ src, alt }: { src: string; alt?: string }) => {
    if (!editor) return;
    const trimmed = src.trim();
    if (!trimmed) return;
    editor.chain().focus().setImage({ src: trimmed, alt }).run();
    setImageOpen(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-input overflow-hidden bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring transition-shadow",
        className,
      )}>
      <MenuBar
        editor={editor}
        onAskLink={() => setLinkOpen(true)}
        onAskImage={() => setImageOpen(true)}
      />
      <EditorContent editor={editor} />
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        initialUrl={currentLinkUrl}
        onSubmit={submitLink}
      />
      <ImageDialog
        open={imageOpen}
        onOpenChange={setImageOpen}
        onSubmit={submitImage}
      />
    </div>
  );
}
