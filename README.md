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

Native local notifications can appear on the lock screen and while another app is open when the user grants notification permission. The app schedules them with the default notification sound and a time-sensitive interruption level.

Daily, weekly, monthly, and every-hour reminders are scheduled as repeating native local notifications. Multi-hour reminders are scheduled for their next occurrence and are rescheduled when the app handles a complete or snooze action, because Capacitor's repeat API does not support every-N-hours intervals directly.

Ignoring the Ring/Silent switch, Do Not Disturb, or vibrator-only mode requires Apple's Critical Alerts entitlement. That entitlement is granted by Apple only for approved use cases, so this app cannot guarantee sound while the iPhone is muted unless that entitlement is approved and added to the native iOS target.

## iPhone Install

After the GitHub Pages deployment is live, open the site in Safari, tap Share, then choose **Add to Home Screen**.

Note: iOS PWAs can show notifications after install and permission approval, but scheduled background notifications are more limited than a native App Store app. This app keeps the in-app reminder pop-up active while the app is open and uses browser notifications when supported.

## GitHub Pages Setup

If the first deployment fails with a message about Pages not being enabled, open the repository's **Settings > Pages**, choose **GitHub Actions** as the source, save, then rerun the **Deploy PWA** workflow.
