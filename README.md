<p align="center">
  <img src="assets/icon.png" width="96" alt="ColdPost icon" />
</p>

<h1 align="center">ColdPost</h1>

<p align="center">Plan TikTok posts across accounts. Your phone buzzes when each one is due.</p>

<p align="center">
  <a href="https://github.com/caprarim/coldpost/raw/main/ColdPost.apk"><b>Download APK</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/caprarim/coldpost/releases/latest">Releases</a>
</p>

## How it works

1. Add your TikTok handles. No login.
2. Pick an account, add videos, set a start time and a gap.
3. When a post is due, tap the reminder. TikTok opens with the video loaded and the caption copied.
4. Switch to the right account in TikTok, paste, post.

## Why the last tap is yours

TikTok only lets audited apps post publicly, and it does not approve personal upload tools. ColdPost stays free and inside TikTok's rules by leaving the final tap to you.

## Privacy

Everything stays on your phone. No accounts, no servers, no analytics.

## Build it yourself

```sh
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

MIT licensed.
