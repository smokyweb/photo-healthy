const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const REMOTE_DIR = '/home3/photobai/public_html';
const NODE_BIN = '/opt/alt/alt-nodejs16/root/bin';

async function execSSH(cmd) {
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

function getAllFiles(dir, baseDir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      results.push({ local: fullPath, relative: path.relative(baseDir, fullPath).replace(/\\/g, '/') });
    }
  }
  return results;
}

async function main() {
  console.log('=== Photo Healthy Deployment ===\n');

  // Step 1: Check Node.js version
  console.log('1. Checking server...');
  const nodeCheck = await execSSH(`${NODE_BIN}/node -v && ${NODE_BIN}/npm -v`);
  console.log('  Node:', nodeCheck.trim());

  // Step 2: Create directories via SSH
  console.log('\n2. Creating directories...');
  const mkdirOutput = await execSSH(`
    mkdir -p ${REMOTE_DIR}/dist-web
    mkdir -p ${REMOTE_DIR}/uploads
    echo "Directories created"
    ls -la ${REMOTE_DIR}/
  `);
  console.log(mkdirOutput);

  // Step 3: Upload files via SFTP
  console.log('\n3. Uploading files...');
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);

  // Upload dist-web files
  console.log('  Frontend build...');
  const distFiles = getAllFiles(path.join(__dirname, 'dist-web'), path.join(__dirname, 'dist-web'));
  for (const f of distFiles) {
    const remotePath = `${REMOTE_DIR}/dist-web/${f.relative}`;
    console.log(`  -> ${f.relative}`);
    await sftp.put(f.local, remotePath);
  }

  // Upload server files
  console.log('  Server files...');
  const serverFiles = ['server.js', 'package.json', 'setup.sql'];
  for (const file of serverFiles) {
    const localPath = path.join(__dirname, 'server', file);
    if (fs.existsSync(localPath)) {
      console.log(`  -> ${file}`);
      await sftp.put(localPath, `${REMOTE_DIR}/${file}`);
    }
  }

  await sftp.end();
  console.log('  Upload complete!');

  // Step 4: Create .env
  console.log('\n4. Creating .env...');
  const envSetup = await execSSH(`
    cat > ${REMOTE_DIR}/.env << 'EOF'
PORT=3001
DB_HOST=localhost
DB_USER=photobai
DB_PASSWORD=
DB_NAME=photobai_photohealthy
JWT_SECRET=photohealthy_jwt_secret_2026
EOF
    echo "Created .env"
  `);
  console.log(envSetup);

  // Step 5: Install npm dependencies
  console.log('5. Installing dependencies...');
  const installOutput = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    npm install --production 2>&1 | tail -20
  `);
  console.log(installOutput);

  // Step 6: Check MySQL access
  console.log('\n6. Checking MySQL...');
  const dbCheck = await execSSH(`
    mysql -e "SHOW DATABASES" 2>&1 | head -20
  `);
  console.log(dbCheck);

  // Step 7: Try to setup database
  console.log('7. Setting up database...');
  const dbSetup = await execSSH(`
    cd ${REMOTE_DIR}
    # Try with the user's database
    mysql -e "CREATE DATABASE IF NOT EXISTS photobai_photohealthy" 2>&1
    mysql photobai_photohealthy < setup.sql 2>&1 || echo "SETUP_NEEDS_ATTENTION"
  `);
  console.log(dbSetup);

  // Step 8: Start server
  console.log('\n8. Starting server...');
  const startOutput = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    pkill -f "node.*server.js" 2>/dev/null || true
    sleep 1
    cd ${REMOTE_DIR}
    nohup node server.js > server.log 2>&1 &
    echo "PID: $!"
    sleep 3
    ps aux | grep "[n]ode.*server.js" | head -3
    echo "--- Log ---"
    cat server.log 2>/dev/null | tail -10
  `);
  console.log(startOutput);

  // Step 9: Create .htaccess for reverse proxy
  console.log('\n9. Setting up Apache proxy...');
  const htaccessSetup = await execSSH(`
    cat > ${REMOTE_DIR}/.htaccess << 'HTEOF'
RewriteEngine On

# Proxy API and upload requests to Node.js
RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
RewriteRule ^uploads/(.*)$ http://127.0.0.1:3001/uploads/$1 [P,L]

# Serve static files from dist-web
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{DOCUMENT_ROOT}/dist-web/%{REQUEST_URI} -f
RewriteRule ^(.*)$ /dist-web/$1 [L]

# SPA fallback - serve index.html for all other routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /dist-web/index.html [L]
HTEOF
    echo ".htaccess created"
  `);
  console.log(htaccessSetup);

  console.log('\n=== Deployment complete! ===');
  console.log('Frontend: https://photoai.betaplanets.com');
  console.log('API: https://photoai.betaplanets.com/api/challenges');
}

main().catch(err => {
  console.error('Deployment error:', err.message);
  process.exit(1);
});
