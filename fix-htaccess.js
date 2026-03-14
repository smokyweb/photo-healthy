const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const path = require('path');

const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const NODE_BIN = '/opt/alt/alt-nodejs16/root/bin';
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
  // Check what's in public_html root
  console.log('1. Checking root files...');
  let out = await execSSH(`
    ls -la ${REMOTE_DIR}/
    echo "---"
    find ${REMOTE_DIR} -name "index.html" -o -name "index.php" 2>/dev/null
    echo "---"
    # Check if there's a default page
    file ${REMOTE_DIR}/index.* 2>/dev/null || echo "no index files in root"
  `);
  console.log(out);

  // New approach: Move dist-web files to root and use simple htaccess
  console.log('\n2. Moving dist-web files to root...');
  out = await execSSH(`
    cd ${REMOTE_DIR}
    # Copy dist-web contents to root
    cp dist-web/*.html .
    cp dist-web/*.js .
    cp dist-web/*.js.map . 2>/dev/null
    cp dist-web/*.txt . 2>/dev/null
    cp dist-web/*.png .
    cp dist-web/manifest.json .
    echo "Files copied to root"
    ls -la ${REMOTE_DIR}/*.html ${REMOTE_DIR}/*.js
  `);
  console.log(out);

  // Create a simple .htaccess that just does SPA fallback
  console.log('\n3. Updating .htaccess...');
  out = await execSSH(`
    cat > ${REMOTE_DIR}/.htaccess << 'HTEOF'
RewriteEngine On

# Serve existing files directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# SPA fallback - all other routes serve index.html
RewriteRule ^ /index.html [L]
HTEOF
    echo ".htaccess updated"
    cat ${REMOTE_DIR}/.htaccess
  `);
  console.log(out);

  // Test
  console.log('\n4. Testing...');
  out = await execSSH(`
    curl -sI -H "Host: photoai.betaplanets.com" http://127.0.0.1/ 2>&1
    echo "==="
    curl -s -H "Host: photoai.betaplanets.com" http://127.0.0.1/ 2>&1 | head -15
  `);
  console.log(out);

  console.log('\nDone!');
}

main().catch(console.error);
