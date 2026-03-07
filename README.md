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
```
1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

------

testings 
1. k6 static load test (passed ✅)
   `k6 run load-test.js` (run it in the root directory)
2. database stress test (passed ✅)  
   ```
   1.1 Open your website in Chrome/Edge and log in.
   1.2 Run ONE audit manually (upload an image and click "Run Audit"). This ensures there is data ready to be submitted.
   1.3 Open the Console: Press F12 (or Cmd+Option+J on Mac) and click the Console tab.
   1.4 Copy and Paste: Copy the entire code from db-stress-test.js into the console and press Enter.
   1.5 Start the test: Type the following in the console and press Enter:
   runSubmissionTest(200);
   ```

