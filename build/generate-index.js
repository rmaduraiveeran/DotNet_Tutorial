// Generates index.html for the .NET tutorial app.
// Run: node build/generate-index.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const dayScripts = Array.from({ length: 30 }, (_, i) => `  <script src="js/content/day${String(i + 1).padStart(2, '0')}.js"></script>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Master .NET in 30 Days — Interactive Tutorial</title>
<meta name="description" content="A structured, interactive 30-day curriculum that takes you from .NET beginner to advanced developer. Includes deep-dive framework comparisons, runnable C# examples, and conceptual diagrams.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
</head>
<body>
<a class="skip-link" href="#content">Skip to main content</a>

<header class="topbar">
  <div class="topbar-inner">
    <button id="sidebarToggle" class="icon-btn" aria-label="Toggle navigation">☰</button>
    <a href="#/home" class="brand" data-route="#/home">
      <span class="brand-mark">&lt;&gt;</span>
      <span class="brand-text">Master <b>.NET</b> in 30 Days</span>
    </a>
    <div class="topbar-actions">
      <button id="themeToggle" class="icon-btn" aria-label="Toggle dark mode">&#9728;</button>
      <div class="progress-chip" id="progressChip" title="Days completed">
        <span class="progress-chip-label">Progress</span>
        <div class="bar"><i id="chipBar" style="width:0%"></i></div>
        <span id="chipText" class="chip-text">0 / 30</span>
      </div>
    </div>
  </div>
</header>

<div class="layout">
  <aside class="sidebar" id="sidebar" aria-label="Curriculum navigation">
    <nav id="nav"></nav>
  </aside>
  <main id="content" class="content" tabindex="-1"></main>
  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
</div>

<script src="js/data/course.js"></script>
${dayScripts}
<script src="js/content/frameworks.js"></script>
<script src="js/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log('index.html written:', html.length, 'chars');
