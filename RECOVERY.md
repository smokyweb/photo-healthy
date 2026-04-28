# Photo Healthy PWA — Recovery Reference
**Stable snapshot tagged:** `stable-v1-layout` (April 28, 2026)
**Repo:** https://github.com/smokyweb/photo-healthy (branch: master)

---

## 🔄 To restore to this stable point

```bash
cd C:\Temp\photohealthy
git fetch origin
git checkout stable-v1-layout
npm run build:web
node C:\Temp\deploy-quick.js
# Then upload bundles (see deploy section below)
```

---

## 📦 Deploy Process

**NEVER use `deploy-all.js`** — the GitHub push inside it times out.

Use this 2-step deploy instead:

### Step 1 — Upload index.html
```
node C:\Temp\deploy-quick.js
```

### Step 2 — Upload JS bundles
```js
// C:\Temp\deploy-bundles.js
const SftpClient = require('C:/Users/kevin/AppData/Roaming/npm/node_modules/ssh2-sftp-client');
const fs = require('fs');
const CONFIG = { host: 'server.bluestoneapps.com', port: 22004, username: 'photobai', password: '5J=G0)PKG%ybVK%d' };
const REMOTE = '/home3/photobai/public_html';
async function main() {
  const s = new SftpClient();
  await s.connect(CONFIG);
  const files = fs.readdirSync('C:/Temp/photohealthy/dist-web');
  for (const f of files) {
    if (f === 'index.html') continue;
    const local = 'C:/Temp/photohealthy/dist-web/' + f;
    if (!fs.statSync(local).isDirectory()) await s.put(local, REMOTE + '/' + f);
  }
  await s.end();
  console.log('Done');
}
main().catch(console.error);
```

### Step 3 — Push to GitHub separately
```bash
cd C:\Temp\photohealthy && git push origin master
```

---

## 🐛 Known Gotchas / Lessons Learned

### 1. Emoji Mojibake
**Problem:** Emoji in `.tsx` files get saved as mojibake (`ðŸ"·`, `â†'`, `â—`) when the write tool encodes incorrectly.
**Fix:** Use Node.js `fs.writeFileSync(path, content, 'utf8')` to write files with emoji. Never write emoji directly via the edit/write tools.
**Fix scripts:** `C:\Temp\fix-mojibake3.js`, `fix-home3.js`, `fix-home4.js`, `fix-home5.js`, `fix-home6.js`, `fix-admin.js`
**Run all:** `node fix-mojibake3.js && node fix-home3.js && node fix-home4.js && node fix-home5.js && node fix-home6.js && node fix-admin.js` (from `C:\Temp\`)

### 2. FlatList Breaks Web Scrolling
**Problem:** `FlatList` inside a `flex: 1` container on React Native Web creates its own scroll container, blocking browser scroll.
**Fix:** Replace ALL `FlatList` with `ScrollView` + manual `.map()` + `chunkArray()` for grids. Never use FlatList on web screens.
**Also fix:** Remove `flex: 1` from root `screen:` StyleSheet entries — use `backgroundColor: C.BG` only (no flex).

### 3. React Navigation Web Scroll Trap
**Problem:** Stack Navigator wraps screens in `overflow: hidden` + fixed height, blocking scroll.
**Fix:** `ScreenWithNav.tsx` injects a CSS override on mount. `OuterScreenWrapper` in App.tsx uses `minHeight: '100vh'` instead of `flex: 1` on web.

### 4. API Field Names
- Submissions: photo is `photo1_url` (not `image_url`)
- Products: name is `title` (not `name`)
- Admin check: use `user.is_admin === 1` OR `user.role === 'admin'` (DB uses `is_admin`)
- Comments: param is `submission_id` (not `submissionId`)
- Pro status: check `user.subscription_status === 'active'` (not `user.is_pro`)

### 5. `{number && <Component />}` renders "0"
**Problem:** `{item.is_pro_only && <View>}` renders literal "0" text when `is_pro_only` is `0`.
**Fix:** Always use `{!!item.is_pro_only && <View>}` or `{item.is_pro_only ? <View> : null}`

### 6. `\uXXXX` Escape Sequences in JSX
**Problem:** When writing TSX via the write tool, `\uD83D\uDCF7` renders as the literal string, not the emoji.
**Fix:** Write the file with a Node.js script using actual UTF-8 codepoints: `String.fromCodePoint(0x1F4F7)` or just paste real emoji in the Node script string.

### 7. Image URLs
All relative image URLs need the BASE prefix:
```js
const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (u) => u ? (u.startsWith('http') ? u : BASE + u) : null;
```

---

## 🏗️ Architecture

- **Stack:** React Native Web (Expo/webpack), Node.js + Express backend, SQLite DB
- **Server:** `server.bluestoneapps.com:22004`, user `photobai`, remote `/home3/photobai/public_html/`
- **Live URL:** https://photoai.betaplanets.com
- **GitHub:** https://github.com/smokyweb/photo-healthy (branch: master)
- **Process manager:** PM2 (`pm2 restart photo-healthy`)

### Key Files
```
src/
  screens/          ← All page screens
  components/       ← Shared: TopNavBar, AppFooter, GradientButton, ChallengeCard, etc.
  context/          ← AuthContext, CartContext
  services/api.ts   ← All API calls
  theme.ts          ← Colors (C.BG, C.ORANGE, C.TEAL, etc.)
App.tsx             ← Navigation + OuterScreenWrapper + MainTabs
server/server.js    ← Node.js backend
```

### Theme Colors
```js
BG: '#202333'        // Page background
CARD_BG: '#3B3E4F'   // Card background
CARD_BG2: '#2C2F40'  // Darker card
ORANGE: '#F55B09'    // Primary accent
TEAL: '#54DFB6'      // Secondary accent
TEXT: '#FFFFFF'
TEXT_MUTED: '#8B9AB0'
CARD_BORDER: 'rgba(255,255,255,0.08)'
DANGER: '#ef4444'
```

### Gradient Buttons
```js
// Orange gradient (primary)
backgroundImage: 'linear-gradient(90deg, #F55B09, #FFD000)'
// Teal gradient
backgroundImage: 'linear-gradient(90deg, #54DFB6, #29B6E0)'
```

---

## ✅ What's Working (as of stable-v1-layout)

- [x] Full navigation (TopNavBar + AppFooter on all pages, mobile bottom tabs)
- [x] Public homepage (hero, features, how it works, community gallery)
- [x] Logged-in dashboard (featured challenge, stats, submissions grid, quick actions)
- [x] Challenges page (3-col grid, featured banner, category filter from DB, search, status tabs)
- [x] Challenge detail (2-col desktop, submit photos, community submissions, pagination)
- [x] Submission detail (photo, comments, post comment, like)
- [x] Community page (photo grid, sort tabs, 4-col desktop)
- [x] Gallery page (user's own photos)
- [x] Shop page (products grid, category/search filter, featured section)
- [x] Product detail (2-col, quantity selector, add to cart)
- [x] Cart (item list, quantity controls, order summary, checkout)
- [x] Subscription page (Pro pricing card, Stripe checkout)
- [x] Profile page (avatar, stats, action list, recent photos, sign out)
- [x] Edit Profile
- [x] My Progress
- [x] Order History
- [x] About Us (hero, philosophy, our story, values, CTA)
- [x] How It Works (alternating steps, Pro benefits)
- [x] Partners page (existing tiers + new PDF layout with campaign flow, tiers, contact form)
- [x] FAQ (accordion, search)
- [x] Contact (2-col form + info)
- [x] Legal (tabs: Terms / Privacy / Guidelines)
- [x] Admin panel (Dashboard, Challenges CRUD, Users, Submissions, Products, Orders, Settings)
- [x] Login / Register / Reset Password
- [x] All emoji rendering correctly (mojibake fixed)
- [x] Browser scroll working on all pages (no FlatList, no flex:1 trap)
- [x] Dark theme consistent throughout

---

## 🔧 Quick Fix Commands

```bash
# Rebuild and deploy
cd C:\Temp\photohealthy
npm run build:web
node C:\Temp\deploy-quick.js
# Then upload bundles

# Fix emoji corruption
node C:\Temp\fix-mojibake3.js
node C:\Temp\fix-home3.js && node C:\Temp\fix-home4.js && node C:\Temp\fix-home5.js
node C:\Temp\fix-home6.js && node C:\Temp\fix-admin.js

# Restore stable snapshot
git checkout stable-v1-layout
```
