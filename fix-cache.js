const { Client } = require('ssh2');
const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const REMOTE_DIR = '/home3/photobai/public_html';

function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('close', () => { conn.end(); resolve(output); });
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { output += data.toString(); });
      });
    });
    conn.on('error', reject);
    conn.connect(CONFIG);
  });
}

async function main() {
  // Clear LiteSpeed cache
  console.log('1. Clearing cache...');
  let out = await execSSH(`
    # Clear lscache
    rm -rf ~/lscache/* 2>/dev/null
    echo "lscache cleared"

    # Verify our index.html is in place
    ls -la ${REMOTE_DIR}/index.html
    echo "---"
    head -5 ${REMOTE_DIR}/index.html
    echo "---"

    # Make sure .htaccess doesn't have cache directives blocking us
    cat ${REMOTE_DIR}/.htaccess
  `);
  console.log(out);

  // Add cache-busting headers to .htaccess
  console.log('\n2. Adding cache headers...');
  out = await execSSH(`
    cat > ${REMOTE_DIR}/.htaccess << 'HTEOF'
RewriteEngine On

# Disable LiteSpeed cache for now
<IfModule LiteSpeed>
  CacheDisable public /
</IfModule>

# Set proper headers
<FilesMatch "\\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires 0
</FilesMatch>

# Serve existing files directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# SPA fallback
RewriteRule ^ /index.html [L]
HTEOF
    echo "Updated .htaccess"
  `);
  console.log(out);

  // Test with no-cache headers
  await new Promise(r => setTimeout(r, 2000));
  console.log('\n3. Testing...');
  out = await execSSH(`
    curl -sI -H "Host: photoai.betaplanets.com" -H "Cache-Control: no-cache" http://127.0.0.1/ 2>&1
    echo "==="
    curl -s -H "Host: photoai.betaplanets.com" -H "Cache-Control: no-cache" http://127.0.0.1/ 2>&1 | head -15
    echo "==="
    # Try direct file access
    curl -s -H "Host: photoai.betaplanets.com" http://127.0.0.1/index.html 2>&1 | head -15
  `);
  console.log(out);

  // Try external access
  console.log('\n4. External test...');
  out = await execSSH(`
    curl -skI https://photoai.betaplanets.com/ 2>&1
    echo "==="
    curl -sk https://photoai.betaplanets.com/ 2>&1 | head -15
  `);
  console.log(out);
}

main().catch(console.error);
