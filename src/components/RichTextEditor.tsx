import React, { useRef, useState } from "react";
import { Bold, Italic, Heading1, Heading2, List, Quote, Code, Table, Link as LinkIcon, Image as ImageIcon, Sparkles, Eye, Edit2, Underline } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  onAiSuggest?: (currentContent: string, beforeCursor: string) => Promise<string>;
  aiLoading?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  onAiSuggest,
  aiLoading = false,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = before + (selected || "text") + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    onChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || "text").length);
    }, 10);
  };

  const handleAiContinue = async () => {
    if (!onAiSuggest) return;
    const textarea = textareaRef.current;
    const cursor = textarea ? textarea.selectionStart : value.length;
    
    // Grab text immediately preceding the cursor (up to 500 characters) for context
    const beforeCursor = value.substring(Math.max(0, cursor - 500), cursor);
    
    const continuation = await onAiSuggest(value, beforeCursor);
    if (continuation) {
      const newValue = value.substring(0, cursor) + "\n\n" + continuation + value.substring(cursor);
      onChange(newValue);
    }
  };

  // Convert custom Markdown rules to HTML for preview
  const renderMarkdown = (md: string) => {
    if (!md) return '<p class="text-neutral-400 dark:text-neutral-600">Nothing to preview yet. Start writing...</p>';
    
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Blockquotes: > quote
    html = html.replace(/^\s*>\s+(.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-4 italic text-neutral-600 dark:text-neutral-400">$1</blockquote>');

    // Code blocks: ```code```
    html = html.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto text-neutral-800 dark:text-neutral-200"><code>$2</code></pre>');

    // Inline Code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-xs text-red-500">$1</code>');

    // Headings: # H1, ## H2
    html = html.replace(/^\s*#\s+(.+)$/gm, '<h1 class="text-2xl font-extrabold text-neutral-900 dark:text-white mt-6 mb-3">$1</h1>');
    html = html.replace(/^\s*##\s+(.+)$/gm, '<h2 class="text-xl font-bold text-neutral-900 dark:text-white mt-5 mb-2">$1</h2>');
    html = html.replace(/^\s*###\s+(.+)$/gm, '<h3 class="text-lg font-bold text-neutral-900 dark:text-white mt-4 mb-2">$1</h3>');

    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Italic: *text*
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Underline: __text__
    html = html.replace(/__([^_]+)__/g, '<u class="underline">$1</u>');

    // Unordered Lists: - item
    html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc list-inside ml-4 text-neutral-700 dark:text-neutral-300">$1</li>');

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');

    // Images: ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-h-80 mx-auto my-4 shadow-sm" referrerPolicy="no-referrer" />');

    // Parse tables
    const lines = html.split("\n");
    let inTable = false;
    let tableHtml = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.endsWith("|")) {
        if (!inTable) {
          inTable = true;
          tableHtml += '<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-neutral-200 dark:border-neutral-800 text-sm">';
        }
        
        const cells = line.split("|").slice(1, -1).map(c => c.trim());
        
        // Skip separator line (e.g. |---|---|)
        if (cells.every(c => c.startsWith("-"))) {
          continue;
        }

        const tag = tableHtml.includes("<thead>") ? "td" : "th";
        const wrapperStart = tag === "th" ? "<thead><tr class='bg-neutral-50 dark:bg-neutral-900'>" : "<tr>";
        const wrapperEnd = tag === "th" ? "</tr></thead><tbody>" : "</tr>";
        
        tableHtml += wrapperStart;
        cells.forEach(cell => {
          tableHtml += `<${tag} class="border border-neutral-200 dark:border-neutral-800 px-4 py-2 font-medium">${cell}</${tag}>`;
        });
        tableHtml += wrapperEnd;
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += "</tbody></table></div>";
          lines[i] = tableHtml + "\n" + lines[i];
          tableHtml = "";
        }
      }
    }
    html = lines.join("\n");

    // Standard paragraphs: handle double linebreaks
    html = html.split(/\n\s*\n/).map(p => {
      p = p.trim();
      if (!p) return "";
      // Avoid wrapping already parsed block tags
      if (p.startsWith("<h") || p.startsWith("<li") || p.startsWith("<pre") || p.startsWith("<block") || p.startsWith("<div") || p.startsWith("<table")) {
        return p;
      }
      return `<p class="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">${p.replace(/\n/g, "<br />")}</p>`;
    }).join("");

    return html;
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900/40">
      {/* Editor Headers / Tab Selector */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/60 px-4 py-2.5">
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "write"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm border border-neutral-200/40 dark:border-neutral-700/40"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Write Markdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm border border-neutral-200/40 dark:border-neutral-700/40"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* AI Action Tool */}
        {onAiSuggest && activeTab === "write" && (
          <button
            type="button"
            onClick={handleAiContinue}
            disabled={aiLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Generates a smooth next paragraph contextual to where your cursor is positioned."
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
            <span>{aiLoading ? "AI Writing..." : "AI Auto-Continue"}</span>
          </button>
        )}
      </div>

      {/* Editor Toolbar */}
      {activeTab === "write" && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50/20 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => insertFormat("**", "**")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Bold (**text**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("*", "*")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Italic (*text*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("__", "__")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Underline (__text__)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => insertFormat("# ")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Header 1 (# )"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("## ")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Header 2 (## )"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => insertFormat("- ")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Bulleted List (- )"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("> ")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Blockquote (> )"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("```\n", "\n```")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Code Block (```)"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => insertFormat("| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Table"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("[", "](https://example.com)")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Hyperlink ([text](url))"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("![Alt Text](", ")")}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Image Markdown (![alt](url))"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Input Area */}
      <div className="p-1 bg-white dark:bg-neutral-950/20">
        {activeTab === "write" ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your creative story here using standard markdown syntax. Tip: Place your cursor and click 'AI Auto-Continue' to help spark ideas!"
            className="w-full min-h-[350px] p-4 bg-transparent border-0 outline-0 ring-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-200 font-sans text-sm sm:text-base resize-y leading-relaxed"
          />
        ) : (
          <div
            className="w-full min-h-[350px] p-6 text-left overflow-y-auto prose dark:prose-invert max-w-none prose-neutral"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>
    </div>
  );
}
