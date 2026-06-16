"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { toast } from "sonner";
import {
  TextB,
  TextItalic,
  TextUnderline,
  LinkSimple,
  ListBullets,
  Image as ImageIcon,
  Eye,
  PencilSimple,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { uploadChangelogImage } from "@/lib/api";

// Tailwind descendant styling for the live preview (admin has no typography
// plugin). Mirrors how the showcase + dashboard render the same Markdown.
const MD_PREVIEW =
  "[&>*:first-child]:mt-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_u]:underline " +
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h1]:mb-1 [&_h1]:mt-2 [&_h1]:font-semibold " +
  "[&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:font-semibold " +
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground";

function ToolbarButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      // Keep the textarea's focus + selection so wrapping the right text works.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Tailwind min-height for the input/preview area (e.g. "min-h-28"). */
  minHeight?: string;
}

/**
 * A lightweight Markdown editor: a toolbar (bold / italic / underline / link /
 * list / image upload) that wraps the selection in Markdown, plus a Write /
 * Preview toggle. Stores raw Markdown — the showcase, the dashboard modal, and
 * (stripped to text) the email all consume the same string. The image button
 * uploads to the changelog bucket and inserts `![](url)` at the cursor.
 */
export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = "min-h-28",
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);

  const surround = (before: string, after: string, placeholderText: string) => {
    const ta = ref.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholderText;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      ta?.focus();
      const s = start + before.length;
      ta?.setSelectionRange(s, s + selected.length);
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = ref.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = start + text.length;
      ta?.setSelectionRange(pos, pos);
    });
  };

  const handleImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadChangelogImage(file);
      insertAtCursor(`![](${url})`);
    } catch (e) {
      toast.error(`Image upload failed: ${String(e)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
      <div className="flex items-center gap-0.5 border-b border-input bg-muted/30 px-1 py-1">
        <ToolbarButton title="Bold" onClick={() => surround("**", "**", "bold text")}>
          <TextB className="h-4 w-4" weight="bold" />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => surround("*", "*", "italic text")}>
          <TextItalic className="h-4 w-4" weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          onClick={() => surround("<u>", "</u>", "underlined text")}
        >
          <TextUnderline className="h-4 w-4" weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          title="Link"
          onClick={() => surround("[", "](https://)", "link text")}
        >
          <LinkSimple className="h-4 w-4" weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          onClick={() => surround("\n- ", "", "list item")}
        >
          <ListBullets className="h-4 w-4" weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          title="Insert image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" weight="bold" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTab("write")}
            className={cn(
              "flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors",
              tab === "write"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PencilSimple className="h-3.5 w-3.5" /> Write
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTab("preview")}
            className={cn(
              "flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors",
              tab === "preview"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn(
            "block w-full resize-y bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground",
            minHeight
          )}
        />
      ) : (
        <div className={cn("overflow-y-auto px-3 py-2 text-sm", minHeight)}>
          {value.trim() ? (
            <div className={MD_PREVIEW}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImage(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
