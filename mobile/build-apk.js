const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'green') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`\n📦 Running: ${command}`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function buildAPK() {
  log('\n🚀 Malik.XGO APK Builder\n', 'bright');
  
  // Step 1: Build Next.js app
  log('\n📦 Step 1: Building Next.js application...', 'yellow');
  if (!exec('cd .. && npm run build')) {
    log('Failed to build Next.js app', 'red');
    process.exit(1);
  }

  // Step 2: Create output directory
  log('\n📁 Step 2: Preparing output directory...', 'yellow');
  if (!fs.existsSync('../out')) {
    fs.mkdirSync('../out', { recursive: true });
  }

  // Step 3: Copy files to Capacitor web directory
  log('\n📋 Step 3: Copying files to mobile app...', 'yellow');
  exec('rm -rf www');
  exec('mkdir -p www');
  exec('cp -r ../out/* www/ 2>/dev/null || true');
  
  // Copy index.html if not exists
  if (!fs.existsSync('www/index.html')) {
    fs.writeFileSync('www/index.html', 
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>Malik.XGO</title></head><body><script>window.location.href = "https://your-production-url.com";</script></body></html>'
    );
  }

  // Step 4: Sync with Capacitor
  log('\n🔄 Step 4: Syncing with Capacitor...', 'yellow');
  if (!exec('npx cap sync')) {
    log('Failed to sync Capacitor', 'red');
    process.exit(1);
  }

  // Step 5: Build APK
  log('\n📱 Step 5: Building APK...', 'yellow');
  
  const buildType = await new Promise((resolve) => {
    rl.question('Build type? (1: Debug APK, 2: Release APK): ', (answer) => {
      resolve(answer === '2' ? 'release' : 'debug');
    });
  });

  if (buildType === 'release') {
    log('\n🔑 Release build requires signing key', 'yellow');
    const hasKey = await new Promise((resolve) => {
      rl.question('Do you have a signing keystore? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });

    if (hasKey) {
      const keystorePath = await new Promise((resolve) => {
        rl.question('Enter keystore path: ', (answer) => resolve(answer));
      });
      const keystoreAlias = await new Promise((resolve) => {
        rl.question('Enter key alias: ', (answer) => resolve(answer));
      });
      const keystorePass = await new Promise((resolve) => {
        rl.question('Enter keystore password: ', (answer) => resolve(answer));
      });

      // Create signing properties file
      const signingProps = `storeFile=${keystorePath}
storePassword=${keystorePass}
keyAlias=${keystoreAlias}
keyPassword=${keystorePass}`;
      
      fs.writeFileSync('android/key.properties', signingProps);
      
      if (!exec('cd android && ./gradlew assembleRelease')) {
        log('Failed to build release APK', 'red');
        process.exit(1);
      }
    } else {
      log('⚠️  Generating debug APK instead (not for production)', 'yellow');
      if (!exec('cd android && ./gradlew assembleDebug')) {
        log('Failed to build debug APK', 'red');
        process.exit(1);
      }
    }
  } else {
    if (!exec('cd android && ./gradlew assembleDebug')) {
      log('Failed to build debug APK', 'red');
      process.exit(1);
    }
  }

  // Step 6: Copy APK to output
  log('\n📦 Step 6: Copying APK to output...', 'yellow');
  
  const apkPath = buildType === 'release' 
    ? 'android/app/build/outputs/apk/release/app-release.apk'
    : 'android/app/build/outputs/apk/debug/app-debug.apk';
  
  const outputDir = '../apk-output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, `malik-xgo-${buildType}.apk`);
  
  if (fs.existsSync(apkPath)) {
    fs.copyFileSync(apkPath, outputPath);
    log(`\n✅ APK built successfully!`, 'green');
    log(`📍 Location: ${outputPath}`, 'cyan');
    log(`📱 Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`, 'cyan');
  } else {
    log('❌ APK file not found!', 'red');
  }

  rl.close();
}

// Run the build
buildAPK().catch(console.error);