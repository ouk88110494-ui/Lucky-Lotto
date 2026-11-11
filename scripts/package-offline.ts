import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Starting Offline Standalone Single-File Packaging...');

// 1. Run Vite build with vite.config.offline.ts
console.log('📦 Bundling application with Vite SingleFile...');
execSync('npx vite build --config vite.config.offline.ts', { stdio: 'inherit' });

const distOfflineHtmlPath = path.resolve(process.cwd(), 'dist-offline/index.html');
if (!fs.existsSync(distOfflineHtmlPath)) {
  console.error('❌ dist-offline/index.html not found!');
  process.exit(1);
}

const rawHtml = fs.readFileSync(distOfflineHtmlPath, 'utf8');

// Locate the inlined <script> tag and inlined <style> tag accurately
const scriptStartIdx = rawHtml.indexOf('<script type="module" crossorigin>');
if (scriptStartIdx === -1) {
  console.error('❌ Could not locate inlined script tag in dist-offline/index.html');
  process.exit(1);
}

const scriptEndIdx = rawHtml.lastIndexOf('</script>');
if (scriptEndIdx === -1) {
  console.error('❌ Could not locate closing script tag in dist-offline/index.html');
  process.exit(1);
}

// Extract the inlined JavaScript code
const jsCode = rawHtml.substring(scriptStartIdx + '<script type="module" crossorigin>'.length, scriptEndIdx);

// Locate the inlined CSS <style> block
const styleStartIdx = rawHtml.indexOf('<style rel="stylesheet" crossorigin>', scriptEndIdx);
const styleEndIdx = rawHtml.lastIndexOf('</style>');

let cssCode = '';
if (styleStartIdx !== -1 && styleEndIdx !== -1 && styleEndIdx > styleStartIdx) {
  cssCode = rawHtml.substring(styleStartIdx + '<style rel="stylesheet" crossorigin>'.length, styleEndIdx);
} else {
  // Fallback if attributes differ
  const anyStyleStart = rawHtml.lastIndexOf('<style');
  const anyStyleEnd = rawHtml.lastIndexOf('</style>');
  if (anyStyleStart !== -1 && anyStyleEnd > anyStyleStart) {
    const sTagEnd = rawHtml.indexOf('>', anyStyleStart) + 1;
    cssCode = rawHtml.substring(sTagEnd, anyStyleEnd);
  }
}

// Construct 100% clean, offline, standalone HTML
const standaloneHtml = `<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>幸運抽獎機 - 離網單機版</title>
    <meta name="description" content="專業活動與尾牙抽獎APP，支援Excel名單匯入匯出、自訂獎項、擬真號碼球箱抽獎與中獎大螢幕展示（免連網單機獨立版）" />
    <style id="offline-font-system">
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body, button, input, select, textarea, div, span, p, h1, h2, h3, h4, h5, h6 {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", "Helvetica Neue", Arial, sans-serif !important;
      }
    </style>
    <style id="app-compiled-styles">
      ${cssCode}
    </style>
  </head>
  <body class="bg-[#050b1e] text-slate-100 min-h-screen">
    <div id="root"></div>
    <script>
      ${jsCode}
    </script>
  </body>
</html>
`;

// Save to public/ and dist/
const publicTargetPath = path.resolve(process.cwd(), 'public/幸運抽獎機_離網單機版.html');
const distTargetPath = path.resolve(process.cwd(), 'dist/幸運抽獎機_離網單機版.html');

fs.writeFileSync(publicTargetPath, standaloneHtml, 'utf8');
fs.mkdirSync(path.dirname(distTargetPath), { recursive: true });
fs.writeFileSync(distTargetPath, standaloneHtml, 'utf8');

const stats = fs.statSync(publicTargetPath);
console.log(`✅ Standalone offline file generated successfully!`);
console.log(`📁 File: public/幸運抽獎機_離網單機版.html (${(stats.size / 1024).toFixed(1)} KB)`);
console.log(`🎉 100% Offline Single File ready: Classic script, zero CORS restrictions under file://, offline fonts, self-contained sounds & Excel engine.`);
