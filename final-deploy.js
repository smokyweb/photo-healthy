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

function execSSH(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    const timer = setTimeout(() => { conn.end(); resolve(output); }, timeout);
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { clearTimeout(timer); conn.end(); return reject(err); }
        stream.on('close', () => { clearTimeout(timer); conn.end(); resolve(output); });
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { output += data.toString(); });
      });
    });
    conn.on('error', (err) => { clearTimeout(timer); reject(err); });
    conn.connect(CONFIG);
  });
}

async function main() {
  // Kill any existing server
  console.log('1. Killing existing server...');
  await execSSH('pkill -f "node.*server.js" 2>/dev/null; echo done');

  // Create a proper startup script with crontab reboot persistence
  console.log('2. Setting up startup script and crontab...');
  let out = await execSSH(`
    # Create start script
    cat > ${REMOTE_DIR}/start.sh << 'EOF'
#!/bin/bash
export PATH=/opt/alt/alt-nodejs16/root/bin:$PATH
cd /home3/photobai/public_html

# Kill existing
pkill -f "node.*server.js" 2>/dev/null || true
sleep 1

# Start
nohup node server.js >> server.log 2>&1 &
echo $! > server.pid
EOF
    chmod +x ${REMOTE_DIR}/start.sh

    # Add to crontab for auto-restart
    (crontab -l 2>/dev/null | grep -v "start.sh"; echo "@reboot /home3/photobai/public_html/start.sh") | crontab -
    # Also add a watchdog every 5 min
    (crontab -l 2>/dev/null | grep -v "watchdog"; echo "*/5 * * * * pgrep -f 'node.*server.js' > /dev/null || /home3/photobai/public_html/start.sh") | crontab -
    crontab -l
    echo "Done"
  `);
  console.log(out);

  // Use 'at now' to start the server detached from this SSH session
  console.log('\n3. Starting server via at command...');
  out = await execSSH(`
    which at 2>/dev/null && echo "at available" || echo "no at"
    echo "---"
    # Try using bash -c with full detachment
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    bash -c 'nohup /opt/alt/alt-nodejs16/root/bin/node /home3/photobai/public_html/server.js >> /home3/photobai/public_html/server.log 2>&1 &'
    echo "launched"
    sleep 2
    pgrep -a -f "node.*server.js"
    echo "---"
    tail -3 ${REMOTE_DIR}/server.log
  `);
  console.log(out);

  // If still not running, try using 'at now'
  if (!out.includes('server.js') || out.includes('---\n---')) {
    console.log('\n3b. Trying at now...');
    out = await execSSH(`
      echo "bash ${REMOTE_DIR}/start.sh" | at now 2>&1
      sleep 3
      pgrep -a -f "node.*server.js"
      echo "---"
      tail -3 ${REMOTE_DIR}/server.log
    `);
    console.log(out);
  }

  // Wait and test
  await new Promise(r => setTimeout(r, 3000));
  console.log('\n4. Testing API...');
  out = await execSSH(`
    curl -s http://127.0.0.1:3001/api/challenges 2>&1 | head -5
    echo "---"
    curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ 2>&1
  `);
  console.log(out);

  // Also check if .htaccess is correct - test with external URL
  console.log('\n5. Testing external access...');
  out = await execSSH(`
    curl -s -o /dev/null -w "HTTP %{http_code}" https://photoai.betaplanets.com/ 2>&1
    echo ""
    curl -s -o /dev/null -w "HTTP %{http_code}" https://photoai.betaplanets.com/dist-web/index.html 2>&1
    echo ""
    curl -s https://photoai.betaplanets.com/dist-web/index.html 2>&1 | head -10
  `);
  console.log(out);

  console.log('\nDone!');
}

main().catch(console.error);
