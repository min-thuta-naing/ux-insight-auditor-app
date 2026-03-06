<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/229c8cca-e7bd-408f-bd28-c17488330b12

## Run Locally

**Prerequisites:**  Node.js

BEFORE THIS 
create .env.local file in the root directory
```
VITE_GEMINI_API_KEY=AIzaSyDhPgMpok1WXxcJtj9t3Ibx8byAFTGqEXc
VITE_FIREBASE_API_KEY=AIzaSyDJAkGS__riu4GmI_HUBWKHhfjwU6yu0KY
VITE_FIREBASE_AUTH_DOMAIN=ux-insight-auditor.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ux-insight-auditor
VITE_FIREBASE_STORAGE_BUCKET=ux-insight-auditor.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=337371263483
VITE_FIREBASE_APP_ID=1:337371263483:web:0d283846b93f3b0d579b5e
VITE_FIREBASE_MEASUREMENT_ID=G-5L6XKDCY7D
```
1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

