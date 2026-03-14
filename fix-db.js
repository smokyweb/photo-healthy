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
  // Check MySQL socket path and try socket connection
  console.log('1. Finding MySQL socket...');
  let out = await execSSH(`
    mysql_config --socket 2>/dev/null || echo "no mysql_config"
    echo "---"
    ls -la /var/lib/mysql/mysql.sock 2>/dev/null
    ls -la /var/run/mysqld/mysqld.sock 2>/dev/null
    ls -la /tmp/mysql.sock 2>/dev/null
    echo "---"
    # Try connecting with mysql cli - this uses socket by default on localhost
    mysql -u photobai_phuser -pPh0t0H3@lthy2026 photobai_photohealthy -e "SELECT 1 as test" 2>&1
  `);
  console.log(out);

  // Try with socketPath in Node
  console.log('\n2. Testing socket connection...');
  out = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}

    # Find the socket
    SOCKET=$(mysql_config --socket 2>/dev/null || echo "/var/lib/mysql/mysql.sock")
    echo "Socket path: $SOCKET"

    node -e "
      const mysql = require('mysql2/promise');
      async function test() {
        try {
          // Try with socketPath
          const pool = mysql.createPool({
            socketPath: '/var/lib/mysql/mysql.sock',
            user: 'photobai_phuser',
            password: 'Ph0t0H3@lthy2026',
            database: 'photobai_photohealthy',
          });
          const [rows] = await pool.query('SELECT * FROM challenges');
          console.log('SUCCESS! Challenges:', JSON.stringify(rows));
          await pool.end();
        } catch(e) {
          console.error('Socket error:', e.message);

          // Try with different socketPaths
          const sockets = ['/tmp/mysql.sock', '/var/run/mysqld/mysqld.sock', '/var/lib/mysql/mysql.sock'];
          for (const s of sockets) {
            try {
              const p = mysql.createPool({ socketPath: s, user: 'photobai_phuser', password: 'Ph0t0H3@lthy2026', database: 'photobai_photohealthy' });
              const [r] = await p.query('SELECT 1');
              console.log('Working socket:', s);
              await p.end();
              break;
            } catch(e2) { console.log('  ' + s + ': ' + e2.message); }
          }
        }
      }
      test();
    " 2>&1
  `);
  console.log(out);

  // Also try connecting via the remote MySQL host (some cPanel use internal hostname)
  console.log('\n3. Checking cpanel MySQL settings...');
  out = await execSSH(`
    uapi Mysql get_server_information 2>&1
    echo "==="
    # Check if remote MySQL is enabled
    uapi Mysql get_restrictions 2>&1
  `);
  console.log(out);
}

main().catch(console.error);
