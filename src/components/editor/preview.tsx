"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import katex from "katex";

type Props = {
  content: string;
};

// We'll swap this for WASM parser once wired — for now uses a simple transform
function parseMarkdown(raw: string): string {
  return (
    raw
      // headings
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // bold / italic
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // blockquote
      .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
      // hr
      .replace(/^---$/gm, "<hr />")
      // paragraphs (double newline)
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[h|b|e|c|p|h])(.+)$/gm, "<p>$1</p>")
  );
}

export function Preview({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "dark" });
  }, []);

  useEffect(() => {
    if (!content) {
      setHtml("");
      return;
    }

    let processed = content;

    // --- KaTeX: block math $$...$$ ---
    processed = processed.replace(/\$\$([^$]+)\$\$/gs, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return expr;
      }
    });

    // --- KaTeX: inline math $...$ ---
    processed = processed.replace(/\$([^$\n]+)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return expr;
      }
    });

    // --- Mermaid: extract and replace with placeholders ---
    const mermaidBlocks: string[] = [];
    processed = processed.replace(
      /```mermaid\n([\s\S]+?)```/g,
      (_, diagram) => {
        const id = `mermaid-${mermaidBlocks.length}`;
        mermaidBlocks.push(diagram.trim());
        return `<div class="mermaid-placeholder" data-index="${mermaidBlocks.length - 1}" id="${id}"></div>`;
      },
    );

    // --- Syntax highlight: other code blocks ---
    processed = processed.replace(
      /```(\w+)?\n([\s\S]+?)```/g,
      (_, lang, code) => {
        return `<pre class="code-block" data-lang="${lang ?? ""}"><code>${code.trim()}</code></pre>`;
      },
    );

    // --- Base markdown ---
    processed = parseMarkdown(processed);

    setHtml(processed);

    // Render mermaid after DOM update
    if (mermaidBlocks.length > 0) {
      requestAnimationFrame(async () => {
        for (let i = 0; i < mermaidBlocks.length; i++) {
          const el = window.document.getElementById(`mermaid-${i}`);
          if (!el) continue;
          try {
            const { svg } = await mermaid.render(
              `mermaid-svg-${i}`,
              mermaidBlocks[i],
            );
            el.innerHTML = svg;
          } catch (err) {
            el.innerHTML = `<pre class="text-red-400 text-xs">Diagram error</pre>`;
          }
        }
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto px-[max(2rem,calc(50%-36rem))] py-12"
    >
      <div
        className="prose prose-invert prose-sm max-w-none
                   prose-headings:font-mono prose-headings:font-light
                   prose-headings:tracking-tight prose-headings:text-[#f0f0f0]
                   prose-p:text-[#aaa] prose-p:leading-7
                   prose-code:text-[#e63946] prose-code:font-mono prose-code:text-xs
                   prose-strong:text-[#e0e0e0]
                   prose-blockquote:border-[#e63946] prose-blockquote:text-[#666]
                   prose-hr:border-[#1a1a1a]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
