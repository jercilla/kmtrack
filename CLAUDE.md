# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KMTrack is a Progressive Web App (PWA) built with Ionic + Angular + Capacitor for mobile development. This project uses modern Angular standalone components and the latest versions of all dependencies with Node.js 22.20.0 LTS.

## Project Structure

```
kmtrack/
├── src/
│   ├── app/
│   │   ├── tabs/              # Tab navigation pages
│   │   ├── tab1/              # Home tab
│   │   ├── tab2/              # Track tab
│   │   ├── tab3/              # Stats tab
│   │   ├── app.component.*    # Root app component
│   │   └── app.routes.ts      # Application routing
│   ├── assets/
│   │   └── icons/             # PWA icons directory
│   ├── environments/          # Environment configurations
│   ├── theme/                 # Ionic theme variables
│   ├── manifest.json          # PWA manifest file
│   ├── index.html             # Main HTML file
│   ├── main.ts                # Bootstrap file with PWA config
│   ├── polyfills.ts           # Browser polyfills
│   └── global.scss            # Global styles
├── capacitor.config.ts        # Capacitor configuration
├── ngsw-config.json          # Service worker configuration
├── angular.json              # Angular CLI configuration
├── ionic.config.json         # Ionic configuration
├── tsconfig*.json            # TypeScript configurations
└── package.json              # Node.js dependencies and scripts
```

## Development Commands

**Node.js Setup:**
```bash
# Use correct Node.js version (required)
source ~/.nvm/nvm.sh && nvm use 22.20.0
```

**Development:**
```bash
# Install dependencies
npm install

# Start development server
npm start

# Ionic development server
ionic serve

# Build for production
npm run build

# Build with PWA features (production only)
ng build --configuration=production
```

**Mobile Development:**
```bash
# Add mobile platforms
npx cap add ios
npx cap add android

# Sync with mobile platforms
npx cap sync

# Open in native IDE
npx cap open ios
npx cap open android
```

## Architecture Notes

### Modern Angular Setup
- **Standalone Components**: Uses Angular standalone components (no NgModules)
- **Angular 20+**: Latest Angular version with modern features
- **TypeScript 5.9**: Latest TypeScript with strict configuration
- **Bootstrap Application**: Uses `bootstrapApplication` instead of platform bootstrap

### PWA Configuration
- **Service Worker**: Angular Service Worker configured for production builds
- **Manifest**: Complete PWA manifest with icon definitions
- **Offline Support**: Asset caching and offline functionality
- **Installable**: Can be installed as native app on mobile devices

### Ionic + Capacitor Integration
- **Ionic Angular 8**: Latest Ionic version with standalone components
- **Capacitor 7**: Latest Capacitor for native device access
- **Tab Navigation**: Pre-configured tab-based navigation structure
- **Ionic Components**: Uses Ionic standalone components throughout

### Key Files
- `src/main.ts`: Application bootstrap with PWA and Ionic configuration
- `src/app/app.routes.ts`: Main application routing configuration
- `angular.json`: Build configuration with PWA service worker settings
- `ngsw-config.json`: Service worker caching strategies

## Important Notes

### Node.js Version Management
- **Required**: Node.js 22.20.0 LTS (installed via nvm)
- **NVM Command**: Always run `source ~/.nvm/nvm.sh && nvm use 22.20.0` before development
- **Compatibility**: All dependencies are compatible with Node.js 22.x

### PWA Features
- **Production Only**: PWA features (service worker) only work in production builds
- **HTTPS Required**: PWA features require HTTPS in production
- **Service Worker**: Auto-registers after 30 seconds of app stability

### Development Environment
- **VS Code Ready**: Project structure optimized for VS Code development
- **No Subdirectories**: All files in current directory for easy npm command execution
- **Modern Stack**: Uses latest versions of all major dependencies

### Capacitor Mobile Development
- **iOS**: Requires Xcode and iOS development setup
- **Android**: Requires Android Studio and Android SDK
- **Cross-platform**: Single codebase for web, iOS, and Android platforms