const fs = require('fs');
const path = require('path');

// Kill any existing parcel processes that might interfere
try {
  const { execSync } = require('child_process');
  execSync('pkill -f parcel', { stdio: 'ignore' });
} catch (err) {
  // No parcel processes running, which is fine
}

// Ensure dist directory exists and is completely clean
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  // Remove entire directory and recreate it
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Read the main HTML file
const htmlPath = path.join(__dirname, '..', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Read the JavaScript file
const jsPath = path.join(__dirname, '..', 'src', 'index.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Read the CSS file
const cssPath = path.join(__dirname, '..', 'src', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Replace the CSS import with inline styles
htmlContent = htmlContent.replace('@import "./src/style.css";', cssContent);

// Replace the JavaScript placeholder with actual content - look for the entire script block
const jsPlaceholder = /<script>\s*\/\/ This will be replaced by the build script with the actual content of index\.js\s*\/\/ INLINE_JS_PLACEHOLDER\s*<\/script>/;
if (jsPlaceholder.test(htmlContent)) {
  htmlContent = htmlContent.replace(jsPlaceholder, `<script>\n${jsContent}\n</script>`);
} else {
  console.log('⚠️  JavaScript placeholder not found - content may not be inlined properly');
}

// Write the combined file
const outputPath = path.join(distDir, 'index.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Build complete: dist/index.html');

// Quick cleanup check
setTimeout(() => {
  const currentFiles = fs.readdirSync(distDir);
  const unwantedFiles = currentFiles.filter(file => file !== 'index.html');
  
  if (unwantedFiles.length > 0) {
    unwantedFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // Ignore errors
      }
    });
  }
  
  process.exit(0);
}, 500);
