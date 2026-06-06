# Reminder Tracker

An installable iPhone-friendly reminder tracker PWA inspired by Apple Reminders.

## Features

- Create one-time, hourly, daily, weekly, or monthly reminders.
- Customize reminder time, snooze duration, priority, category, notes, and weekly day selections.
- Get an in-app due reminder pop-up with complete and snooze actions.
- Request browser notifications for installed PWA use.
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

## iPhone Install

After the GitHub Pages deployment is live, open the site in Safari, tap Share, then choose **Add to Home Screen**.

Note: iOS PWAs can show notifications after install and permission approval, but scheduled background notifications are more limited than a native App Store app. This app keeps the in-app reminder pop-up active while the app is open and uses browser notifications when supported.

## GitHub Pages Setup

If the first deployment fails with a message about Pages not being enabled, open the repository's **Settings > Pages**, choose **GitHub Actions** as the source, save, then rerun the **Deploy PWA** workflow.
