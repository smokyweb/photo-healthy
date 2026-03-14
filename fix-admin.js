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
  // Use Node.js to update the admin password directly via MySQL
  console.log('Fixing admin password...');
  let out = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    node -e "
      require('dotenv').config();
      const bcrypt = require('bcryptjs');
      const mysql = require('mysql2/promise');

      async function fix() {
        const pool = mysql.createPool({
          socketPath: '/var/lib/mysql/mysql.sock',
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });

        // Hash admin123
        const hash = await bcrypt.hash('admin123', 10);
        console.log('New hash:', hash);

        // Update admin user
        await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'admin@photohealthy.com']);
        console.log('Updated admin password');

        // Verify
        const [rows] = await pool.query('SELECT id, email, password_hash FROM users WHERE email = ?', ['admin@photohealthy.com']);
        console.log('User:', rows[0].email);
        const valid = await bcrypt.compare('admin123', rows[0].password_hash);
        console.log('Password verify:', valid);

        await pool.end();
      }
      fix().catch(console.error);
    " 2>&1
  `);
  console.log(out);

  // Test login
  console.log('\nTesting login...');
  out = await execSSH(`
    curl -s -X POST http://127.0.0.1:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@photohealthy.com","password":"admin123"}' 2>&1 | head -3
  `);
  console.log(out);
}

main().catch(console.error);
