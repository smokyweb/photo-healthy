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
  // Upload updated server.js
  console.log('1. Uploading updated server.js...');
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);
  await sftp.put(path.join(__dirname, 'server', 'server.js'), `${REMOTE_DIR}/server.js`);
  await sftp.end();
  console.log('  Done');

  // Update .env with socket path
  console.log('\n2. Updating .env with socket...');
  let out = await execSSH(`
    cat > ${REMOTE_DIR}/.env << 'EOF'
PORT=3001
DB_SOCKET=/var/lib/mysql/mysql.sock
DB_USER=photobai_phuser
DB_PASSWORD=Ph0t0H3@lthy2026
DB_NAME=photobai_photohealthy
JWT_SECRET=photohealthy_jwt_secret_2026_secure
EOF
    echo "Updated"
  `);
  console.log(out);

  // Restart server
  console.log('3. Restarting server...');
  out = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    pkill -f "node.*server.js" 2>/dev/null || true
    sleep 1
    cd ${REMOTE_DIR}
    nohup node server.js >> server.log 2>&1 &
    echo "PID: $!"
    sleep 3
    ps aux | grep "[n]ode.*server.js" | head -3
    echo "---LOG---"
    tail -5 server.log 2>/dev/null
    echo "---API TEST---"
    curl -s http://127.0.0.1:3001/api/challenges 2>&1 | head -3
  `);
  console.log(out);

  // Test the external URL
  console.log('\n4. Testing external URL...');
  out = await execSSH(`
    curl -s -o /dev/null -w "%{http_code}" https://photoai.betaplanets.com/ 2>&1
    echo ""
    curl -s https://photoai.betaplanets.com/api/challenges 2>&1 | head -5
  `);
  console.log(out);

  console.log('\nDone!');
}

main().catch(console.error);
