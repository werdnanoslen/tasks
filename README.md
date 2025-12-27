A web app for keeping track of tasks

<img alt="Demo on phone" src="./public/demo-screenshot.png" width="500px" />

# Setup

First, be sure mysql is running, `npm install` packages, and create an `.env` file based on `.env.example`.

Then start the server (`npm run server`) and app (`npm start`). Open [localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes. Run with `--demo` arg to create demo data.

# Android App

The front-end is configured to build as a native Android app using Capacitor. After making changes to the web app, rebuild and sync:

```bash
npm run build && npx cap sync android
```

The Android project is located in the `/android` folder. App configuration can be modified in `capacitor.config.ts`.

Open in Android Studio:

```bash
npx cap open android
```

Or build from command line (requires Android SDK):

```bash
cd android && ./gradlew assembleDebug
```