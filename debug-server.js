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
  // Check server.log
  console.log('=== Server Logs ===');
  let out = await execSSH(`cat ${REMOTE_DIR}/server.log 2>&1`);
  console.log(out || '(empty)');

  // Try running server directly to see errors
  console.log('\n=== Direct test ===');
  out = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    node -e "console.log('node works'); console.log(process.version);" 2>&1
    echo "---"
    node -e "require('dotenv').config(); console.log('dotenv loaded');" 2>&1
    echo "---"
    ls -la ${REMOTE_DIR}/node_modules/express/package.json 2>/dev/null && echo "express installed" || echo "express NOT installed"
    echo "---"
    cat ${REMOTE_DIR}/.env 2>&1
    echo "---"
    # Try starting server in foreground with timeout
    timeout 5 node server.js 2>&1 || echo "EXIT: $?"
  `);
  console.log(out);
}

main().catch(console.error);
