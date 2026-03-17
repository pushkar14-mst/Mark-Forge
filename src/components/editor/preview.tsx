"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import katex from "katex";
import { useMarkdownWorker } from "@/hooks/useMarkdownWorker";

type Props = {
  content: string;
};

export function Preview({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");
  const { parse } = useMarkdownWorker();

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "dark" });
  }, []);

  useEffect(() => {
    if (!content) {
      setHtml("");
      return;
    }

    let cancelled = false;

    async function render() {
      let processed = content;

      // --- KaTeX: block math $$...$$ ---
      const blockMathMap: Record<string, string> = {};
      processed = processed.replace(/\$\$([^$]+)\$\$/gs, (_, expr) => {
        const key = `__BLOCK_MATH_${Object.keys(blockMathMap).length}__`;
        try {
          blockMathMap[key] = katex.renderToString(expr.trim(), {
            displayMode: true,
            throwOnError: false,
          });
        } catch {
          blockMathMap[key] = expr;
        }
        return key;
      });

      // --- KaTeX: inline math $...$ ---
      const inlineMathMap: Record<string, string> = {};
      processed = processed.replace(/\$([^$\n]+)\$/g, (_, expr) => {
        const key = `__INLINE_MATH_${Object.keys(inlineMathMap).length}__`;
        try {
          inlineMathMap[key] = katex.renderToString(expr.trim(), {
            displayMode: false,
            throwOnError: false,
          });
        } catch {
          inlineMathMap[key] = expr;
        }
        return key;
      });

      // --- Mermaid: extract before WASM parse ---
      const mermaidMap: Record<string, string> = {};
      processed = processed.replace(
        /```mermaid\n([\s\S]+?)```/g,
        (_, diagram) => {
          const key = `__MERMAID_${Object.keys(mermaidMap).length}__`;
          mermaidMap[key] = diagram.trim();
          return `<div class="mermaid-placeholder" data-key="${key}" id="${key}"></div>`;
        },
      );

      // --- WASM markdown parse ---
      let renderedHtml = await parse(processed);
      if (cancelled) return;

      // --- Restore KaTeX placeholders ---
      for (const [key, val] of Object.entries(blockMathMap)) {
        renderedHtml = renderedHtml.replace(key, val);
      }
      for (const [key, val] of Object.entries(inlineMathMap)) {
        renderedHtml = renderedHtml.replace(key, val);
      }

      setHtml(renderedHtml);

      // --- Render mermaid diagrams after DOM update ---
      if (Object.keys(mermaidMap).length > 0) {
        requestAnimationFrame(async () => {
          for (const [key, diagram] of Object.entries(mermaidMap)) {
            const el = window.document.getElementById(key);
            if (!el) continue;
            try {
              const { svg } = await mermaid.render(`svg-${key}`, diagram);
              el.innerHTML = svg;
            } catch {
              el.innerHTML = `<pre class="text-red-400 text-xs">Diagram error</pre>`;
            }
          }
        });
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [content, parse]);

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
