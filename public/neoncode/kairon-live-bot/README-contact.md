Contact Sales implementation

Files added/changed:
- `index.html` : contact modal markup
- `styles.css` : modal styles
- `script.fixed.js` : modal open/close, submit logic, mailto fallback
- `api/createLead.js` : example Node Express receiver (demo only)

Quick test (local):
1. Start a local static server to serve the `media` folder (so fetch('kairon-faqs.json') works). Example using `http-server` (npm):

   npm install -g http-server
   cd "c:\Users\User\New folder (5)\media"
   http-server -p 8000

2. In a separate terminal run the demo lead receiver (optional, for POST handling):

   node api/createLead.js

3. Open `http://127.0.0.1:8000` in your browser, open Kairon, click or type "contact sales", click the `Contact sales` quick action, fill the form and submit.

Notes:
- If you don't run the demo server, the widget will fall back to opening the user's email client using a `mailto:` link.
- Replace `sales@yourdomain.com` in `script.fixed.js` with your real sales address or wire `/api/leads` to your backend/CRM.
