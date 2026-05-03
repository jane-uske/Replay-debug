# Replay Debug Privacy Policy

Effective date: May 3, 2026

Replay Debug is a Chrome extension for local web page recording and replay. It helps developers and testers reproduce frontend issues by recording page state, user actions, network metadata, console output, JavaScript errors, and a limited number of screenshots.

This policy explains what data the extension handles, how that data is used, and how you can control it.

## Summary

- Replay Debug stores recording data locally in your browser by default.
- Replay Debug does not upload recording data to our servers.
- Replay Debug does not sell, rent, share, or use recording data for advertising.
- Exported JSON files may contain sensitive information. Only share them with people you trust.

## Data the Extension Handles

When you explicitly start a recording, Replay Debug may handle the following data from the active recording tab:

- Page content and structure, including DOM snapshots and DOM changes recorded by rrweb.
- User actions, including clicks, scrolls, selected special keys, and input events.
- Page navigation information, including page URL, title, route changes, tab information, and timestamps.
- Network request metadata from `fetch` and `XMLHttpRequest`, including URL, method, status, duration, request headers, response headers, content type, request size, and response size.
- Console output from `console.log`, `console.warn`, `console.error`, and `console.info`.
- JavaScript errors, unhandled Promise rejections, and resource loading errors.
- A limited number of screenshots captured during user actions or errors.
- Recording metadata such as session ID, start time, end time, viewport size, and browser user agent.

## Sensitive Data Handling

Replay Debug includes several protections, but recordings may still contain sensitive data because web pages themselves can display sensitive content.

Current protections include:

- `password`, `email`, and `tel` input values are masked.
- Network response bodies are not read by default.
- Common sensitive fields are redacted where possible, including `authorization`, `cookie`, `set-cookie`, `token`, `secret`, `password`, `apiKey`, `session`, `jwt`, `credential`, and `csrf`.
- Console output and error details are redacted and truncated where possible.
- Media elements such as `video` and `audio` are blocked from rrweb replay to avoid unsupported media playback issues.

Important limitations:

- Normal text inputs may still contain sensitive information.
- DOM snapshots may include sensitive information already visible on the page.
- Screenshots may include sensitive information visible on the page.
- URLs may include query parameters that contain sensitive information.
- Exported JSON files contain the recorded session data and should be handled carefully.

## How Data Is Used

Replay Debug uses recording data only to provide its local debugging features:

- replay recorded page activity;
- show a timeline of user actions, network requests, console logs, and errors;
- help developers reproduce and diagnose frontend bugs;
- let users export and import recording sessions.

Replay Debug does not use recording data for:

- advertising;
- user profiling;
- creditworthiness or eligibility decisions;
- sale to third parties;
- analytics unrelated to the extension's user-facing debugging features.

## Data Storage and Retention

Recording data is stored locally in Chrome extension storage, primarily using `chrome.storage.local` and `chrome.storage.session`.

Data remains in local browser storage until you:

- delete a recording from Replay Debug;
- clear the extension's storage;
- uninstall the extension;
- export the data and delete the local copy yourself.

If you export a recording, Replay Debug creates a JSON file on your device. That exported file is controlled by you.

## Data Sharing

Replay Debug does not automatically transmit recording data to any server controlled by the project maintainers.

Recording data leaves your browser only if you choose to export it, upload it, or share it manually.

Replay Debug does not sell or share user data with advertisers, data brokers, or analytics providers.

## Permissions

Replay Debug requests Chrome extension permissions only for its recording and replay features:

- `activeTab`: access the tab where the user starts recording.
- `storage`: save recording sessions and extension state locally.
- `tabs`: read tab URL, title, size, and navigation context.
- `scripting`: inject the content script into the active recording page.
- `webNavigation`: detect new tabs and navigation targets related to the recording.
- `unlimitedStorage`: reduce the risk of losing larger local recordings.
- `<all_urls>` host access: allow recording across different websites when the user starts recording.

Replay Debug does not declare the `webRequest` permission.

## Security

Replay Debug applies masking, redaction, truncation, and local-only storage by default. However, no automatic privacy filter can guarantee removal of all sensitive information from recorded page content, screenshots, URLs, logs, or exported files.

Do not record pages containing highly sensitive information unless you understand and accept the risk.

## User Controls

You can control your data by:

- choosing when to start and stop recording;
- deleting individual recording sessions;
- deleting multiple sessions from the replay page;
- choosing whether to export recording data;
- uninstalling the extension to remove its local extension storage.

## Changes to This Policy

This privacy policy may be updated when Replay Debug changes how it handles data. Significant changes should be reflected in the repository and extension listing before release.

## Contact

For questions, issues, or deletion guidance, please use GitHub Issues:

https://github.com/xiashitao/Replay-debug/issues
