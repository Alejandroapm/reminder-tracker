# Reminder Tracker

An installable iPhone-friendly reminder tracker PWA inspired by Apple Reminders.

## Features

- Create one-time, hourly, daily, weekly, or monthly reminders.
- Customize reminder time, snooze duration, priority, category, notes, and weekly day selections.
- Get an in-app due reminder pop-up with complete and snooze actions.
- Set a username once, then change it later from settings.
- Switch the app between English and Spanish.
- Request browser notifications for installed PWA use.
- Schedule native local notifications when the app is built with Capacitor.
- Store reminders locally in the browser.
- Deploy automatically to GitHub Pages from `main`.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Native iPhone App

This repository now includes a Capacitor iOS project in `ios/`. That is the real iPhone app path. The GitHub Pages version is still only a web preview and cannot guarantee a scheduled iPhone alarm while the website is closed.

### Requirements

- A Mac with **Xcode 15 or newer** (Capacitor 8 uses Swift 5.9).
- **macOS Ventura 13.5+** or newer is recommended for Xcode 15.
- Big Sur can only install up to Xcode 13, which is too old for this Capacitor 8 project. Use Monterey, Ventura, Sonoma, or a newer macOS VM if possible.
- Node.js 20+ and npm.
- An Apple ID (free) for on-device testing, or a paid Apple Developer account for wider distribution.

### Quick Mac bootstrap

After cloning the repo on your Mac:

```bash
chmod +x scripts/mac-ios-bootstrap.sh
./scripts/mac-ios-bootstrap.sh
npm run ios:open
```

Or run the steps manually:

```bash
npm install
npm run ios:sync
npm run ios:open
```

`npm run ios:sync` builds the web app, copies it into the native iOS project, and wires up Capacitor Local Notifications.

### Xcode steps

1. Open `ios/App/App.xcworkspace` or let `npm run ios:open` launch Xcode.
2. Select the **App** target.
3. Under **Signing & Capabilities**, choose your Apple Developer Team.
4. Confirm the bundle identifier is available, or change it from `com.alejandroapm.remindertracker`.
5. Verify **Time Sensitive Notifications** is enabled (already configured in `App.entitlements`).
6. Connect your iPhone with USB, select it as the run destination, then press **Run** (▶).
7. On first install, trust the developer on the phone in **Settings > General > VPN & Device Management**.

To ship a build outside your own device, use **Product > Archive**, then distribute with your signing profile.

You cannot install an unsigned iPhone app directly from GitHub. iOS requires signing before the phone will run it.

## Native iPhone Notifications

The native iOS app uses Capacitor Local Notifications with sound, banner, list, and badge presentation options.

Native local notifications can appear on the lock screen and while another app is open when the user grants notification permission. The app schedules them with the default notification sound and a time-sensitive interruption level.

Daily, weekly, monthly, and every-hour reminders are scheduled as repeating native local notifications. Multi-hour reminders are scheduled for their next occurrence and are rescheduled when the app handles a complete or snooze action, because Capacitor's repeat API does not support every-N-hours intervals directly.

Ignoring the Ring/Silent switch, Do Not Disturb, or vibrator-only mode requires Apple's Critical Alerts entitlement. That entitlement is granted by Apple only for approved use cases, so this app cannot guarantee sound while the iPhone is muted unless that entitlement is approved and added to the native iOS target.

## iPhone Install

After the GitHub Pages deployment is live, open the site in Safari, tap Share, then choose **Add to Home Screen**.

Note: iOS PWAs can show notifications after install and permission approval, but scheduled background notifications are more limited than a native App Store app. This app keeps the in-app reminder pop-up active while the app is open and uses browser notifications when supported.

## GitHub Pages Setup

If the first deployment fails with a message about Pages not being enabled, open the repository's **Settings > Pages**, choose **GitHub Actions** as the source, save, then rerun the **Deploy PWA** workflow.
