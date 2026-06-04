// server.js - WebSocket server for Kairon live chat
// Run: node server.js

const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const STAFF_NAMES = ['Mr.K', 'Mr.A', 'Mr.V', 'Mr.S', 'Mr.M'];

// In-memory stores
const customers = new Map(); // customerId -> { ws, messages:[], assignedStaff, requestedStaff, name }
const staff = new Map(); // staffName -> { ws, status:'online'|'offline'|'busy', activeChats: Set(), pending: Set() }

// initialize staff entries
for (const s of STAFF_NAMES) staff.set(s, { ws: null, status: 'offline', activeChats: new Set(), pending: new Set() });

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Default to index.html for root
  if (pathname === '/') pathname = '/index.html';

  // Serve static files from current directory (media)
  const filePath = path.join(__dirname, pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Determine content type
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ noServer: true });

function safeSend(ws, obj) { try { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); } catch (e) { } }

function broadcastStaffList() {
  const list = Array.from(staff.entries()).map(([name, info]) => ({ name, status: info.status || 'offline', activeCount: info.activeChats.size }));
  const payload = { type: 'staff_list', staff: list };
  for (const [, c] of customers.entries()) safeSend(c.ws, payload);
}

function persistLog(obj) {
  try {
    const logsDir = path.join(__dirname, 'logs'); if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const file = path.join(logsDir, 'live_chats.json');
    let arr = [];
    if (fs.existsSync(file)) arr = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    arr.push(obj);
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
  } catch (e) { console.warn('persistLog failed', e); }
}

server.on('upgrade', (req, socket, head) => {
  const { pathname } = url.parse(req.url);
  if (pathname === '/customer' || pathname === '/staff') {
    wss.handleUpgrade(req, socket, head, (ws) => { ws.pathname = pathname; wss.emit('connection', ws, req); });
  } else socket.destroy();
});

function noop() { }
function heartbeat() { this.isAlive = true; }

wss.on('connection', (ws, req) => {
  ws.isAlive = true; ws.on('pong', heartbeat);
  const pathname = ws.pathname || url.parse(req.url).pathname;
  console.log('WS connected on', pathname);

  ws.on('message', (raw) => {
    let data = {};
    try { data = JSON.parse(raw); } catch (e) { return; }

    if (pathname === '/customer') {
      let cid = data.customerId || ws.customerId;
      if (!cid) { cid = 'c_' + uuidv4(); ws.customerId = cid; customers.set(cid, { ws, messages: [], assignedStaff: null, requestedStaff: null, name: data.customerName || 'Guest' }); console.log('[WS] New customer connected', cid, 'name=', data.customerName || 'Guest'); safeSend(ws, { type: 'connected', customerId: cid }); broadcastStaffList(); return; }

      if (!customers.has(cid)) customers.set(cid, { ws, messages: [], assignedStaff: null, requestedStaff: null, name: data.customerName || 'Guest' });
      const customer = customers.get(cid); customer.ws = ws;

      if (data.type === 'request_staff') {
        const target = data.requestedStaff; customer.requestedStaff = target; const s = staff.get(target);
        console.log('[WS] Customer', cid, 'requested staff', target);
        if (!s || s.status !== 'online') { console.log('[WS] Requested staff not online:', target); safeSend(ws, { type: 'request_failed', reason: 'offline', requested: target }); return; }
        s.pending.add(cid); safeSend(s.ws, { type: 'request_staff', customerId: cid, customerName: customer.name }); safeSend(ws, { type: 'request_sent', requested: target }); return;
      }

      if (data.type === 'request_any') {
        console.log('[WS] Customer', cid, 'requested any available agent');
        let candidate = null, min = Infinity;
        for (const [name, info] of staff.entries()) if (info.status === 'online') { const load = info.activeChats.size; if (load < min) { min = load; candidate = name; } }
        if (!candidate) { safeSend(ws, { type: 'no_staff' }); return; }
        safeSend(staff.get(candidate).ws, { type: 'request_staff', customerId: cid, customerName: customer.name }); safeSend(ws, { type: 'request_sent', requested: candidate }); return;
      }

      if (data.type === 'customer_message') {
        console.log('[WS] Customer message from', cid, '->', data.message);
        const msg = { type: 'customer_message', customerId: cid, message: data.message, customerName: customer.name };
        customer.messages.push(msg);
        const assigned = customer.assignedStaff;
        if (assigned && staff.has(assigned)) safeSend(staff.get(assigned).ws, msg);
        else for (const [, info] of staff.entries()) if (info.status === 'online') safeSend(info.ws, { type: 'queued_message', customerId: cid, message: data.message, customerName: customer.name });
        return;
      }

      return;
    }

    if (pathname === '/staff') {
      const sname = data.staffName || ws.staffName;
      if (data.type === 'staff_online') {
        if (!sname) return; if (!staff.has(sname)) staff.set(sname, { ws, status: 'online', activeChats: new Set(), pending: new Set() });
        const s = staff.get(sname); s.ws = ws; s.status = 'online'; ws.staffName = sname;
        console.log('[WS] Staff online:', sname);
        for (const cid of Array.from(s.pending)) { const c = customers.get(cid); if (c) safeSend(ws, { type: 'request_staff', customerId: cid, customerName: c.name }); }
        broadcastStaffList(); return;
      }

      if (data.type === 'staff_offline') { if (!sname) return; if (staff.has(sname)) { const s = staff.get(sname); s.status = 'offline'; s.ws = null; staff.set(sname, s); } broadcastStaffList(); return; }

      if (data.type === 'accept_request') {
        const cid = data.customerId; if (!cid) return; if (!customers.has(cid)) return;
        console.log('[WS] Staff', sname, 'accepted request for', cid);
        const c = customers.get(cid); c.assignedStaff = sname; customers.set(cid, c);
        if (!staff.has(sname)) staff.set(sname, { ws, status: 'online', activeChats: new Set(), pending: new Set() });
        staff.get(sname).activeChats.add(cid); staff.get(sname).pending.delete(cid);
        safeSend(c.ws, { type: 'request_accepted', staff: sname }); safeSend(ws, { type: 'assigned', customerId: cid, customerName: c.name }); broadcastStaffList(); return;
      }

      if (data.type === 'decline_request') { const cid = data.customerId; if (!cid) return; if (staff.has(sname)) staff.get(sname).pending.delete(cid); if (customers.has(cid)) safeSend(customers.get(cid).ws, { type: 'request_declined', staff: sname }); console.log('[WS] Staff', sname, 'declined request for', cid); return; }

      if (data.type === 'staff_message') { const cid = data.customerId; if (!cid) return; console.log('[WS] Staff message from', sname, 'to', cid, ':', data.message); const msg = { type: 'staff_message', staffName: sname, message: data.message }; if (customers.has(cid)) safeSend(customers.get(cid).ws, msg); if (customers.has(cid)) customers.get(cid).messages.push(msg); return; }

      if (data.type === 'transfer_chat') { const cid = data.customerId, to = data.toStaff; if (!cid || !to) return; console.log('[WS] Transfer', cid, 'from', sname, 'to', to); if (staff.has(sname)) staff.get(sname).activeChats.delete(cid); if (!staff.has(to)) return; staff.get(to).activeChats.add(cid); if (customers.has(cid)) { customers.get(cid).assignedStaff = to; safeSend(customers.get(cid).ws, { type: 'transferred', toStaff: to }); safeSend(staff.get(to).ws, { type: 'assigned', customerId: cid, customerName: customers.get(cid).name }); } broadcastStaffList(); return; }

      if (data.type === 'close_chat') { const cid = data.customerId; if (!cid) return; console.log('[WS] Close chat', cid, 'by', sname); if (staff.has(sname)) staff.get(sname).activeChats.delete(cid); if (customers.has(cid)) { customers.get(cid).assignedStaff = null; safeSend(customers.get(cid).ws, { type: 'closed', by: sname }); persistLog({ customerId: cid, closedBy: sname, messages: customers.get(cid).messages || [], at: new Date().toISOString() }); } broadcastStaffList(); return; }

      return;
    }

  });

  ws.on('close', () => {
    if (ws.pathname === '/staff') { const sname = ws.staffName; if (sname && staff.has(sname)) { const s = staff.get(sname); s.status = 'offline'; s.ws = null; staff.set(sname, s); console.log(sname, 'went offline'); } broadcastStaffList(); }
    if (ws.pathname === '/customer') { const cid = ws.customerId; if (cid && customers.has(cid)) { const c = customers.get(cid); c.ws = null; c.status = 'disconnected'; customers.set(cid, c); console.log('customer disconnected', cid); } }
  });

});

setInterval(() => { wss.clients.forEach((ws) => { if (ws.isAlive === false) return ws.terminate(); ws.isAlive = false; ws.ping(noop); }); }, 30000);

server.listen(PORT, () => console.log(`Kairon WS server listening on ${PORT}`));
