/**
 * Build script for Vercel deployment.
 * Copies source files to dist/ and replaces env placeholders in supabase.js
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

// Files to copy to dist
const FILES = ['index.html', 'style.css', 'app.js', 'supabase.js'];

// Ensure dist directory exists
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// Copy files
FILES.forEach((file) => {
  const src = path.join(__dirname, file);
  const dest = path.join(DIST, file);

  let content = fs.readFileSync(src, 'utf-8');

  // Replace env placeholders in supabase.js
  if (file === 'supabase.js') {
    let url = process.env.SUPABASE_URL || '';
    let key = process.env.SUPABASE_KEY || '';

    // Si no están en process.env, intentar leer de .env local
    const envPath = path.join(__dirname, '.env');
    if ((!url || !key) && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split(/\r?\n/).forEach((line) => {
        const [k, ...v] = line.split('=');
        if (k && v.length > 0) {
          const val = v.join('=').trim();
          if (k.trim() === 'SUPABASE_URL' && !url) url = val;
          if (k.trim() === 'SUPABASE_KEY' && !key) key = val;
        }
      });
    }

    if (!url || !key) {
      console.warn('⚠️  SUPABASE_URL or SUPABASE_KEY not set. Using client fallback defaults.');
    }

    if (url) content = content.replace('__SUPABASE_URL__', url.trim());
    if (key) content = content.replace('__SUPABASE_KEY__', key.trim());

    console.log('✅ Supabase credentials injected into supabase.js');
  }

  fs.writeFileSync(dest, content, 'utf-8');
  console.log(`📄 Copied ${file} → dist/${file}`);
});

console.log('\n🚀 Build complete! Output in dist/');
