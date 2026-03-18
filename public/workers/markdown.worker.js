// Module worker — served from public/, never touched by the bundler
import init, { parse_markdown } from '/wasm/markdown_wasm.js';

let ready = false;

async function ensureInit() {
  if (ready) return;
  await init('/wasm/markdown_wasm_bg.wasm');
  ready = true;
}

self.onmessage = async (e) => {
  const { id, markdown } = e.data;
  try {
    await ensureInit();
    const html = parse_markdown(markdown);
    self.postMessage({ id, html, error: null });
  } catch (err) {
    self.postMessage({ id, html: null, error: String(err) });
  }
};
