const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const swPath = path.join(__dirname, '..', 'service-worker.js');

let version = '';

// 1. Try Render Git Commit
if (process.env.RENDER_GIT_COMMIT) {
  version = process.env.RENDER_GIT_COMMIT.substring(0, 7);
  console.log(`[Version SW] Using Render Git Commit: ${version}`);
}

// 2. Try Local Git Commit
if (!version) {
  try {
    version = execSync('git rev-parse --short HEAD').toString().trim();
    console.log(`[Version SW] Using Local Git Commit: ${version}`);
  } catch (e) {
    // Ignore error
  }
}

// 3. Fallback to Timestamp
if (!version) {
  version = `dev-${Date.now()}`;
  console.log(`[Version SW] Fallback to dev timestamp: ${version}`);
}

try {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace APP_VERSION declaration
  const versionRegex = /(const\s+APP_VERSION\s*=\s*['"])([^'"]*)(['"];)/;
  
  if (versionRegex.test(swContent)) {
    const currentVersion = swContent.match(versionRegex)[2];
    if (currentVersion !== version) {
      swContent = swContent.replace(versionRegex, `$1${version}$3`);
      fs.writeFileSync(swPath, swContent, 'utf8');
      console.log(`[Version SW] Successfully updated service-worker.js to version ${version}`);
    } else {
      console.log(`[Version SW] service-worker.js is already at version ${version}. No update needed.`);
    }
  } else {
    console.error('[Version SW] Could not find APP_VERSION declaration in service-worker.js');
  }
} catch (err) {
  console.error('[Version SW] Failed to update service-worker.js:', err.message);
}
