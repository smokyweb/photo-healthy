const { Client } = require('ssh2');
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
  // First, ensure Node.js server is running
  console.log('1. Checking Node.js server...');
  let out = await execSSH(`
    pgrep -a -f "node.*server.js" || echo "NOT RUNNING"
  `);
  console.log(out);

  if (out.includes('NOT RUNNING')) {
    console.log('  Starting server...');
    out = await execSSH(`
      export PATH=${NODE_BIN}:$PATH
      cd ${REMOTE_DIR}
      bash -c 'nohup /opt/alt/alt-nodejs16/root/bin/node /home3/photobai/public_html/server.js >> /home3/photobai/public_html/server.log 2>&1 &'
      sleep 2
      pgrep -a -f "node.*server.js"
    `);
    console.log(out);
  }

  // Test API locally
  console.log('\n2. Testing API locally...');
  out = await execSSH(`
    curl -s http://127.0.0.1:3001/api/challenges 2>&1 | head -3
  `);
  console.log(out);

  // Try .htaccess with proxy
  console.log('\n3. Setting up .htaccess with proxy...');
  out = await execSSH(`
    cat > ${REMOTE_DIR}/.htaccess << 'HTEOF'
RewriteEngine On

# Disable LiteSpeed cache
<IfModule LiteSpeed>
  CacheDisable public /
</IfModule>

<FilesMatch "\\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>

# Proxy API requests to Node.js backend
RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
RewriteRule ^uploads/(.*)$ http://127.0.0.1:3001/uploads/$1 [P,L]

# Serve existing files directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# SPA fallback
RewriteRule ^ /index.html [L]
HTEOF
    echo "Updated"
  `);
  console.log(out);

  // Wait a moment for LiteSpeed to pick up changes
  await new Promise(r => setTimeout(r, 2000));

  // Test API through LiteSpeed
  console.log('\n4. Testing API through LiteSpeed...');
  out = await execSSH(`
    curl -sI -H "Host: photoai.betaplanets.com" http://10.128.0.122/api/challenges 2>&1
    echo "==="
    curl -s -H "Host: photoai.betaplanets.com" http://10.128.0.122/api/challenges 2>&1 | head -5
  `);
  console.log(out);

  // If proxy doesn't work, check if we can use cPanel Node.js app
  if (!out.includes('"challenges"')) {
    console.log('\n5. Proxy not working. Checking cPanel Node.js app manager...');
    out = await execSSH(`
      uapi PassengerApps list_applications 2>&1
      echo "==="
      # Try registering the Node.js app with Passenger
      uapi PassengerApps register_application name=photohealthy path=${REMOTE_DIR} deployment_mode=production enabled=1 base_uri=/api envvar_name_0=PATH envvar_value_0=${NODE_BIN} 2>&1
      echo "==="
      # Check if Passenger is available
      which passenger 2>/dev/null || echo "No passenger"
      ls /opt/cpanel/ea-ruby*/root/usr/sbin/passenger-status 2>/dev/null || echo "No cpanel passenger"
    `);
    console.log(out);

    // Alternative: Use Node.js to serve everything through a PHP proxy
    console.log('\n6. Setting up PHP proxy for API...');
    out = await execSSH(`
      cat > ${REMOTE_DIR}/api.php << 'PHPEOF'
<?php
// PHP proxy for Node.js API
$path = $_SERVER['REQUEST_URI'];
$url = "http://127.0.0.1:3001" . $path;

$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}
if ($method === 'DELETE') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

http_response_code($httpCode);
header("Content-Type: " . ($contentType ?: "application/json"));
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo $response;
PHPEOF
      echo "PHP proxy created"
    `);
    console.log(out);

    // Update .htaccess to use PHP proxy for API
    out = await execSSH(`
      cat > ${REMOTE_DIR}/.htaccess << 'HTEOF'
RewriteEngine On

<IfModule LiteSpeed>
  CacheDisable public /
</IfModule>

<FilesMatch "\\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>

# Route API calls through PHP proxy
RewriteRule ^api/(.*)$ /api.php [L,QSA]
RewriteRule ^uploads/(.*)$ http://127.0.0.1:3001/uploads/$1 [P,L]

# Serve existing files directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# SPA fallback
RewriteRule ^ /index.html [L]
HTEOF
      echo "Updated .htaccess for PHP proxy"
    `);
    console.log(out);

    await new Promise(r => setTimeout(r, 2000));

    // Test PHP proxy
    console.log('\n7. Testing PHP proxy...');
    out = await execSSH(`
      curl -s -H "Host: photoai.betaplanets.com" http://10.128.0.122/api/challenges 2>&1 | head -5
    `);
    console.log(out);
  }
}

main().catch(console.error);
