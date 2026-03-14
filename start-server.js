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
  // Create a wrapper startup script on the server
  console.log('1. Creating startup script...');
  let out = await execSSH(`
    cat > ${REMOTE_DIR}/start.sh << 'STARTEOF'
#!/bin/bash
export PATH=/opt/alt/alt-nodejs16/root/bin:$PATH
cd /home3/photobai/public_html
# Kill existing
pkill -f "node.*server.js" 2>/dev/null
sleep 1
# Start server in background with nohup
nohup node server.js >> server.log 2>&1 &
echo $! > server.pid
echo "Server started with PID: $(cat server.pid)"
STARTEOF
    chmod +x ${REMOTE_DIR}/start.sh
    echo "Script created"
  `);
  console.log(out);

  // Run the startup script
  console.log('\n2. Starting server...');
  out = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    bash start.sh 2>&1
  `);
  console.log(out);

  // Wait and check
  await new Promise(r => setTimeout(r, 3000));
  console.log('\n3. Checking server...');
  out = await execSSH(`
    ps aux | grep "[n]ode.*server.js" | head -3
    echo "---PID---"
    cat ${REMOTE_DIR}/server.pid 2>/dev/null
    echo "---LOG---"
    cat ${REMOTE_DIR}/server.log 2>/dev/null | tail -10
    echo "---TEST---"
    curl -s http://127.0.0.1:3001/api/challenges 2>&1 | head -5
  `);
  console.log(out);

  // If process not running, try with screen
  if (!out.includes('node') || !out.includes('server.js')) {
    console.log('\nProcess not running, trying with screen...');
    out = await execSSH(`
      which screen 2>/dev/null || echo "no screen"
      which tmux 2>/dev/null || echo "no tmux"
    `);
    console.log('Available:', out);

    // Try daemonize approach
    console.log('\nTrying daemon approach...');
    out = await execSSH(`
      export PATH=${NODE_BIN}:$PATH
      cd ${REMOTE_DIR}
      # Use setsid to fully detach
      setsid nohup node server.js >> server.log 2>&1 < /dev/null &
      echo "Launched with setsid, PID: $!"
      sleep 2
      ps aux | grep "[n]ode.*server.js" | head -3
      echo "---"
      curl -s http://127.0.0.1:3001/api/challenges 2>&1 | head -5
    `);
    console.log(out);
  }
}

main().catch(console.error);
