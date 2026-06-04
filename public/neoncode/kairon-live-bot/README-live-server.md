Kairon Live Chat Node WebSocket Server

Run locally (Windows PowerShell):

1. Open PowerShell and change directory to the media folder:

   cd "c:\Users\User\New folder (5)\media"

2. Install dependencies (only needed once):

   npm install

3. Start the server:

   npm start

The server listens on port 3001 by default. Open `media/live_staff.html` and `media/live_customer_widget.html` in your browser (file:// works, but using a local static server is recommended for full functionality).

If you want to change the port, edit `server.js` and adjust the `PORT` constant.
