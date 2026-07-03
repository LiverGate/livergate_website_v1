// Static prerender: render each route to HTML and write dist/<route>/index.html,
// injecting per-route <head> metadata. Run after the client + SSR builds.
import fs from 'node:fs';
import path from 'node:path';
// Built by `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import { render, ROUTES, ORIGIN } from './dist-ssr/entry-server.js';
import type { RouteMeta } from './src/seo';

const DIST = path.resolve('dist');
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headFor(route: RouteMeta): string {
  const url = ORIGIN + (route.canonicalPath ?? route.path);
  return [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(route.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(route.ogDescription)}" />`,
    `<meta name="twitter:url" content="${esc(url)}" />`,
    `<meta name="twitter:title" content="${esc(route.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(route.ogDescription)}" />`,
  ].join('\n    ');
}

if (!template.includes('<!--app-head-->') || !template.includes('<!--app-html-->')) {
  throw new Error('prerender: index.html template is missing injection placeholders');
}

for (const route of ROUTES as RouteMeta[]) {
  const appHtml = render(route.path);
  const html = template
    .replace('<!--app-head-->', headFor(route))
    .replace('<!--app-html-->', appHtml);

  const outDir = route.path === '/' ? DIST : path.join(DIST, route.path);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`prerendered ${route.path}`);
}
