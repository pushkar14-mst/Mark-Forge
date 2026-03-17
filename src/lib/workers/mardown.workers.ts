let wasmReady = false;
let parseMarkdown: ((input: string) => string) | null = null;

async function init() {
  if (wasmReady) return;

  // Dynamically import the wasm-bindgen JS glue
  const wasm = await import("/wasm/markdown_wasm.js" as string);
  await wasm.default("/wasm/markdown_wasm_bg.wasm");
  parseMarkdown = wasm.parse_markdown;
  wasmReady = true;
}

self.onmessage = async (e: MessageEvent<{ id: string; markdown: string }>) => {
  const { id, markdown } = e.data;

  try {
    await init();
    const html = parseMarkdown!(markdown);
    self.postMessage({ id, html, error: null });
  } catch (err) {
    self.postMessage({ id, html: null, error: String(err) });
  }
};
