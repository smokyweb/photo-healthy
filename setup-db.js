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
  // Step 1: Create database via cPanel UAPI
  console.log('1. Creating database via cPanel API...');
  const dbCreate = await execSSH(`
    # Create database using cPanel UAPI
    uapi Mysql create_database name=photobai_photohealthy 2>&1
    echo "---"
    # Create database user
    uapi Mysql create_user name=photobai_phuser password=Ph0t0H3@lthy2026 2>&1
    echo "---"
    # Set privileges
    uapi Mysql set_privileges_on_database user=photobai_phuser database=photobai_photohealthy privileges=ALL 2>&1
  `);
  console.log(dbCreate);

  // Step 2: Import schema
  console.log('\n2. Importing schema...');
  const importSchema = await execSSH(`
    cd ${REMOTE_DIR}
    # Modify setup.sql to use the correct database name
    sed -i 's/CREATE DATABASE IF NOT EXISTS photohealthy/CREATE DATABASE IF NOT EXISTS photobai_photohealthy/g' setup.sql
    sed -i 's/USE photohealthy/USE photobai_photohealthy/g' setup.sql
    mysql -u photobai_phuser -pPh0t0H3@lthy2026 photobai_photohealthy < setup.sql 2>&1
    echo "---"
    mysql -u photobai_phuser -pPh0t0H3@lthy2026 photobai_photohealthy -e "SHOW TABLES" 2>&1
  `);
  console.log(importSchema);

  // Step 3: Update .env with correct DB credentials
  console.log('\n3. Updating .env...');
  const envUpdate = await execSSH(`
    cat > ${REMOTE_DIR}/.env << 'EOF'
PORT=3001
DB_HOST=localhost
DB_USER=photobai_phuser
DB_PASSWORD=Ph0t0H3@lthy2026
DB_NAME=photobai_photohealthy
JWT_SECRET=photohealthy_jwt_secret_2026_secure
EOF
    echo "Updated .env"
  `);
  console.log(envUpdate);

  // Step 4: Update admin password hash (bcrypt hash of "admin123")
  console.log('\n4. Setting admin password...');
  const adminPw = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    node -e "
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin123', 10);
      console.log(hash);
    " 2>&1
  `);
  const pwHash = adminPw.trim();
  console.log('  Generated hash:', pwHash);

  if (pwHash.startsWith('$2a$')) {
    const updatePw = await execSSH(`
      mysql -u photobai_phuser -pPh0t0H3@lthy2026 photobai_photohealthy -e "UPDATE users SET password_hash='${pwHash}' WHERE email='admin@photohealthy.com'" 2>&1
    `);
    console.log('  Updated admin password:', updatePw || 'OK');
  }

  // Step 5: Restart server
  console.log('\n5. Restarting server...');
  const restart = await execSSH(`
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
  console.log(restart);

  // Step 6: Test API
  console.log('\n6. Testing API...');
  const apiTest = await execSSH(`
    curl -s http://127.0.0.1:3001/api/challenges 2>&1
    echo ""
    echo "---"
    curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ 2>&1
  `);
  console.log(apiTest);

  console.log('\nDone!');
}

main().catch(console.error);
