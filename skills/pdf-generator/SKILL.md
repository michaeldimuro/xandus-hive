---
name: pdf-generator
description: Generate professional PDFs from HTML using Puppeteer/Chromium with a built-in design system.
metadata: { "openclaw": { "emoji": "📑", "requires": { "bins": ["node"] } } }
---

# PDF Generator

Generate professional PDF documents from HTML content. Uses Puppeteer with Chromium to render HTML to PDF. Includes a built-in professional stylesheet with a dark-blue/accent-blue design system for reports, proposals, and presentations.

## Approach

There are two ways to generate PDFs depending on your environment:

### Option A: Puppeteer (Node.js)

If Puppeteer and Chromium are available (e.g., in agent containers), use this inline Node.js script:

```bash
node -e "
const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.AGENT_BROWSER_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  const html = require('fs').readFileSync('/tmp/report.html', 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: '/tmp/report.pdf',
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  console.log('PDF saved to /tmp/report.pdf');
})();
"
```

### Option B: wkhtmltopdf / weasyprint (CLI)

If `wkhtmltopdf` or `weasyprint` is available:

```bash
# wkhtmltopdf
wkhtmltopdf --enable-local-file-access /tmp/report.html /tmp/report.pdf

# weasyprint
weasyprint /tmp/report.html /tmp/report.pdf
```

## Built-in Design System

The following CSS classes provide a professional report design. Include this stylesheet in your HTML `<head>`:

### Page Layout

- `.page` -- Wrapper div for each page. Adds a page break after each page.
- `.page:last-child` -- No page break after the last page.

### Cover Page

```html
<div class="page cover">
  <h1>Report Title</h1>
  <div class="accent-line"></div>
  <p class="subtitle">Subtitle or tagline</p>
  <p class="subtitle">Second subtitle line</p>
  <div class="meta">
    <span>Prepared by: Your Name</span>
    <span>Date: March 1, 2026</span>
  </div>
</div>
```

- `.cover` -- Dark blue background, white text, decorative circle accents.
- `.accent-line` -- Blue horizontal accent bar.
- `.subtitle` -- Semi-transparent subtitle text.
- `.meta` -- Bottom-left metadata (author, date, etc.).

### Content Pages

```html
<div class="page content-page">
  <div class="page-header">
    Section Title
    <span class="page-num">Page 2</span>
  </div>
  <div class="page-body">
    <!-- Content here -->
  </div>
  <div class="page-footer">Confidential - Your Company</div>
</div>
```

- `.content-page` -- Light background content page.
- `.page-header` -- Dark blue header bar with accent border.
- `.page-body` -- Padded content area.
- `.page-footer` -- Fixed bottom footer with separator line.

### Cards

```html
<div class="card">
  <div class="card-number">1</div>
  <h3>Card Title</h3>
  <p>Card content and description text goes here.</p>
  <span class="source-tag">Source: Research Paper</span>
</div>
```

- `.card` -- White rounded card with blue left border and shadow.
- `.card-number` -- Circular numbered badge.
- `.source-tag` -- Small gray citation tag.

### Summary / Takeaways Page

```html
<div class="page summary-page">
  <div class="page-header">
    Key Takeaways
    <span class="page-num">Page 5</span>
  </div>
  <div class="summary-box">
    <h2>Summary</h2>
    <div class="accent-underline"></div>
    <div class="takeaway">
      <div class="bullet"></div>
      <div>
        <strong>Key Point One</strong>
        <p>Description of this takeaway point.</p>
      </div>
    </div>
    <div class="takeaway">
      <div class="bullet"></div>
      <div>
        <strong>Key Point Two</strong>
        <p>Description of this takeaway point.</p>
      </div>
    </div>
  </div>
</div>
```

- `.summary-page` -- Dark blue background for emphasis.
- `.summary-box` -- Semi-transparent container.
- `.takeaway` -- Bullet point with bold heading and description.

### Tables

Standard HTML tables are automatically styled:

```html
<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Column 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
      <td>Data</td>
      <td>Data</td>
    </tr>
    <tr>
      <td>Data</td>
      <td>Data</td>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

- `th` -- Dark blue header with white text.
- Even rows get a light gray background.

### Utility Classes

| Class          | Effect                 |
| -------------- | ---------------------- |
| `.grid-2`      | Two-column grid layout |
| `.text-muted`  | Gray text              |
| `.text-accent` | Blue accent text       |
| `.text-small`  | Small (9pt) text       |
| `.mt-1`        | Margin top 8pt         |
| `.mt-2`        | Margin top 16pt        |
| `.mb-1`        | Margin bottom 8pt      |
| `.mb-2`        | Margin bottom 16pt     |

### CSS Variables

Available for custom styling:

```css
--dark-blue: #1a3373;
--accent-blue: #2e75d6;
--light-bg: #f8f9ff;
--light-gray: #f2f2f7;
--mid-gray: #808080;
--text-color: #262626;
--white: #ffffff;
--accent-green: #1aa673;
```

## Complete Stylesheet

Include this in your HTML `<style>` block for the full design system:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt;
  color: #262626;
  line-height: 1.5;
}

:root {
  --dark-blue: #1a3373;
  --accent-blue: #2e75d6;
  --light-bg: #f8f9ff;
  --light-gray: #f2f2f7;
  --mid-gray: #808080;
  --text-color: #262626;
  --white: #ffffff;
  --accent-green: #1aa673;
}

.page {
  page-break-after: always;
  position: relative;
  min-height: 100vh;
}
.page:last-child {
  page-break-after: avoid;
}

.cover {
  background: var(--dark-blue);
  color: var(--white);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 60pt 50pt;
  position: relative;
  overflow: hidden;
}
.cover::before {
  content: "";
  position: absolute;
  top: -80pt;
  right: -60pt;
  width: 300pt;
  height: 300pt;
  border-radius: 50%;
  background: rgba(46, 117, 214, 0.15);
}
.cover::after {
  content: "";
  position: absolute;
  bottom: -100pt;
  left: -80pt;
  width: 350pt;
  height: 350pt;
  border-radius: 50%;
  background: rgba(46, 117, 214, 0.1);
}
.cover h1 {
  font-size: 34pt;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 16pt;
  position: relative;
  z-index: 1;
}
.cover .accent-line {
  width: 120pt;
  height: 4pt;
  background: var(--accent-blue);
  border-radius: 2pt;
  margin-bottom: 18pt;
  position: relative;
  z-index: 1;
}
.cover .subtitle {
  font-size: 14pt;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 8pt;
  position: relative;
  z-index: 1;
}
.cover .meta {
  position: absolute;
  bottom: 50pt;
  left: 50pt;
  font-size: 9.5pt;
  color: rgba(255, 255, 255, 0.5);
  z-index: 1;
}
.cover .meta span {
  margin-right: 20pt;
}

.content-page {
  background: var(--light-bg);
  padding: 0;
}
.content-page .page-header {
  background: var(--dark-blue);
  color: var(--white);
  padding: 18pt 40pt;
  font-size: 18pt;
  font-weight: 700;
  border-bottom: 4pt solid var(--accent-blue);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.content-page .page-header .page-num {
  font-size: 10pt;
  font-weight: 400;
  opacity: 0.7;
}
.content-page .page-body {
  padding: 30pt 40pt;
}
.content-page .page-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12pt 40pt;
  font-size: 8pt;
  color: var(--mid-gray);
  text-align: center;
  border-top: 1pt solid #e0e0e0;
}

.card {
  background: var(--white);
  border-radius: 10pt;
  padding: 20pt 24pt 20pt 28pt;
  margin-bottom: 20pt;
  box-shadow: 2pt 3pt 8pt rgba(0, 0, 0, 0.07);
  border-left: 5pt solid var(--accent-blue);
  position: relative;
}
.card .card-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32pt;
  height: 32pt;
  border-radius: 50%;
  background: var(--light-gray);
  color: var(--accent-blue);
  font-size: 13pt;
  font-weight: 700;
  margin-bottom: 8pt;
}
.card h3 {
  font-size: 13pt;
  font-weight: 700;
  color: var(--dark-blue);
  margin-bottom: 6pt;
}
.card p {
  font-size: 10.5pt;
  line-height: 1.55;
  color: var(--text-color);
}
.card .source-tag {
  display: inline-block;
  margin-top: 10pt;
  padding: 3pt 10pt;
  background: var(--light-gray);
  border-radius: 8pt;
  font-size: 8.5pt;
  color: var(--mid-gray);
}

.summary-page {
  background: var(--dark-blue);
  color: var(--white);
}
.summary-page .page-header {
  background: rgba(0, 0, 0, 0.15);
  padding: 18pt 40pt;
  font-size: 18pt;
  font-weight: 700;
  border-bottom: 4pt solid var(--accent-blue);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-page .page-header .page-num {
  font-size: 10pt;
  font-weight: 400;
  opacity: 0.7;
}
.summary-page .summary-box {
  margin: 30pt 40pt;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12pt;
  padding: 30pt 36pt;
}
.summary-page h2 {
  font-size: 20pt;
  font-weight: 700;
  margin-bottom: 6pt;
}
.summary-page .accent-underline {
  width: 60pt;
  height: 3pt;
  background: var(--accent-blue);
  border-radius: 2pt;
  margin-bottom: 24pt;
}
.takeaway {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16pt;
}
.takeaway .bullet {
  width: 10pt;
  height: 10pt;
  min-width: 10pt;
  border-radius: 50%;
  background: var(--accent-blue);
  margin-top: 4pt;
  margin-right: 14pt;
}
.takeaway strong {
  display: block;
  font-size: 11pt;
  margin-bottom: 2pt;
}
.takeaway p {
  font-size: 10pt;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.text-muted {
  color: var(--mid-gray);
}
.text-accent {
  color: var(--accent-blue);
}
.text-small {
  font-size: 9pt;
}
.mt-1 {
  margin-top: 8pt;
}
.mt-2 {
  margin-top: 16pt;
}
.mb-1 {
  margin-bottom: 8pt;
}
.mb-2 {
  margin-bottom: 16pt;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16pt;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 12pt 0;
}
th {
  background: var(--dark-blue);
  color: var(--white);
  padding: 8pt 12pt;
  text-align: left;
  font-size: 10pt;
}
td {
  padding: 8pt 12pt;
  border-bottom: 1pt solid #e8e8e8;
  font-size: 10pt;
}
tr:nth-child(even) td {
  background: var(--light-gray);
}
```

## Workflow

1. Write your HTML content using the design system classes above
2. Save the HTML to a temp file (e.g., `/tmp/report.html`)
3. Run the Puppeteer script or CLI tool to generate the PDF
4. The PDF is saved to the specified output path

## Page Format Options

| Format | Dimensions    |
| ------ | ------------- |
| A4     | 210mm x 297mm |
| Letter | 8.5in x 11in  |

Set `landscape: true` for horizontal orientation.

## Notes

- The Puppeteer approach requires Chromium to be installed
- `printBackground: true` is essential for the design system's colored backgrounds
- Zero margins are used by default since the design system handles its own padding
- For simple text-to-PDF conversion, consider `weasyprint` or `wkhtmltopdf` as lighter alternatives
- The `AGENT_BROWSER_EXECUTABLE_PATH` environment variable can override the default Chromium path
