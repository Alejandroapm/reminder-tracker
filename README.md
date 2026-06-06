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

## Native iPhone Notifications

The GitHub Pages version is still a PWA. It can show in-app reminders and browser notifications when supported, but it cannot guarantee a scheduled iPhone alarm while the website is closed.

For real scheduled local iPhone notifications, build the Capacitor version:

```bash
npm run cap:add:ios
npm run cap:sync
npm run cap:open:ios
```

The iOS project must be generated and opened on a Mac with Xcode. The app uses Capacitor Local Notifications with sound, banner, list, and badge presentation options.

## iPhone Install

After the GitHub Pages deployment is live, open the site in Safari, tap Share, then choose **Add to Home Screen**.

Note: iOS PWAs can show notifications after install and permission approval, but scheduled background notifications are more limited than a native App Store app. This app keeps the in-app reminder pop-up active while the app is open and uses browser notifications when supported.

## GitHub Pages Setup

If the first deployment fails with a message about Pages not being enabled, open the repository's **Settings > Pages**, choose **GitHub Actions** as the source, save, then rerun the **Deploy PWA** workflow.
