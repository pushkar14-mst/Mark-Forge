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
      // Use raw HTML div placeholders so the markdown parser never sees them as text.
      // __double_underscores__ get processed as bold by the parser, breaking key lookup.
      const blockMathMap: string[] = [];
      processed = processed.replace(/\$\$([^$]+)\$\$/gs, (_, expr) => {
        const id = blockMathMap.length;
        try {
          blockMathMap.push(
            katex.renderToString(expr.trim(), {
              displayMode: true,
              throwOnError: false,
            }),
          );
        } catch {
          blockMathMap.push(expr);
        }
        return `<div data-mfblock="${id}"></div>`;
      });

      // --- KaTeX: inline math $...$ ---
      const inlineMathMap: string[] = [];
      processed = processed.replace(/\$([^$\n]+)\$/g, (_, expr) => {
        const id = inlineMathMap.length;
        try {
          inlineMathMap.push(
            katex.renderToString(expr.trim(), {
              displayMode: false,
              throwOnError: false,
            }),
          );
        } catch {
          inlineMathMap.push(expr);
        }
        return `<span data-mfinline="${id}"></span>`;
      });

      // --- Mermaid: extract before WASM parse ---
      const mermaidMap: string[] = [];
      processed = processed.replace(/```mermaid\n([\s\S]+?)```/g, (_, diagram) => {
        const id = mermaidMap.length;
        mermaidMap.push(diagram.trim());
        return `<div class="mermaid-placeholder" data-mermaid="${id}" id="mermaid-${id}"></div>`;
      });

      // --- WASM markdown parse ---
      let renderedHtml = await parse(processed);
      if (cancelled) return;

      // --- Restore KaTeX block placeholders ---
      // Parser preserves raw HTML divs verbatim, but may wrap them in <p>.
      // Strip any wrapping <p> around our block divs so display math isn't inline.
      renderedHtml = renderedHtml.replace(
        /<p>\s*(<div data-mfblock="(\d+)"><\/div>)\s*<\/p>/g,
        (_, div) => div,
      );
      renderedHtml = renderedHtml.replace(
        /<div data-mfblock="(\d+)"><\/div>/g,
        (_, id) => blockMathMap[Number(id)] ?? "",
      );

      // --- Restore KaTeX inline placeholders ---
      renderedHtml = renderedHtml.replace(
        /<span data-mfinline="(\d+)"><\/span>/g,
        (_, id) => inlineMathMap[Number(id)] ?? "",
      );

      setHtml(renderedHtml);

      // --- Render mermaid diagrams after DOM update ---
      if (mermaidMap.length > 0) {
        requestAnimationFrame(async () => {
          for (let id = 0; id < mermaidMap.length; id++) {
            const el = window.document.getElementById(`mermaid-${id}`);
            if (!el) continue;
            try {
              const { svg } = await mermaid.render(`mermaid-svg-${id}`, mermaidMap[id]);
              el.innerHTML = svg;
            } catch (err) {
              // Show raw source in a code block so the user can see what went wrong
              const escaped = mermaidMap[id]
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              el.innerHTML = `<pre class="text-[#e63946] text-xs font-mono whitespace-pre-wrap border border-[#e63946]/30 p-3 rounded">Diagram error\n\n${escaped}</pre>`;
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
                   prose-blockquote:border-[#e63946] prose-blockquote:text-[#999]
                   prose-hr:border-[#2a2a2a]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
