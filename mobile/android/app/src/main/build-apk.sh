#!/bin/bash

# Malik.XGO APK Builder Script
# Usage: ./build-apk.sh [debug|release]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Malik.XGO APK Builder${NC}"
echo -e "${CYAN}========================${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed (Required for Android build)${NC}"
    exit 1
fi

# Check Android SDK
if [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️  ANDROID_HOME not set${NC}"
fi

# Build type
BUILD_TYPE=${1:-debug}
echo -e "${GREEN}📱 Build type: $BUILD_TYPE${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build Next.js
echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
cd ..
npm run build
cd mobile

# Sync Capacitor
echo -e "${YELLOW}🔄 Syncing Capacitor...${NC}"
npx cap sync

# Build APK
echo -e "${YELLOW}📱 Building APK...${NC}"
if [ "$BUILD_TYPE" = "release" ]; then
    cd android
    ./gradlew assembleRelease
    cd ..
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
else
    cd android
    ./gradlew assembleDebug
    cd ..
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
fi

# Copy APK to output
mkdir -p ../apk-output
cp "$APK_PATH" "../apk-output/malik-xgo-$BUILD_TYPE.apk"

# Show result
APK_SIZE=$(du -h "../apk-output/malik-xgo-$BUILD_TYPE.apk" | cut -f1)
echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${GREEN}📱 APK location: apk-output/malik-xgo-$BUILD_TYPE.apk${NC}"
echo -e "${GREEN}📏 APK size: $APK_SIZE${NC}"