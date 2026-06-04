document.addEventListener('DOMContentLoaded', () => {
    console.log('Kairon script loaded');

    // --- DOM Elements ---
    const root = document.getElementById('kairon');
    const btn = document.getElementById('kairon-button');
    const panel = document.getElementById('kairon-panel');
    const closeBtn = document.getElementById('kairon-close');
    const form = document.getElementById('kairon-form');
    const input = document.getElementById('kairon-input');
    const messages = document.getElementById('kairon-messages');
    const faqPane = document.getElementById('kairon-faq-pane');
    const categoriesEl = document.getElementById('kairon-categories');
    const agentSelector = document.getElementById('agent-selector');

    // --- State ---
    window.onlineAgents = []; // Global for priority logic
    let ws = null;
    let currentAgent = null;
    let allFaqs = [];
    let currentCategory = 'Pricing';

    // --- KEYWORD MAPPING LOGIC ---
    const categoryKeywords = {
        'Pricing': ['cost', 'price', 'quote', 'billing', 'payment', 'rate', 'money', 'charge', 'fee', 'afford', 'budget'],
        'Features': ['design', 'mobile', 'seo', 'cms', 'blog', 'analytics', 'speed', 'responsive', 'platform', 'custom', 'widget', 'plugin'],
        'Account': ['login', 'password', 'sign up', 'access', 'email', 'register', 'account', 'profile', 'user'],
        'Support': ['support', 'help', 'maintenance', 'training', 'documentation', 'tutorial', 'issue', 'problem'],
        'General': [] // Fallback
    };

    // --- CSS for Animated Status Dot ---
    const style = document.createElement('style');
    style.textContent = `
        .status-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-left: 8px;
            transition: background-color 0.3s, box-shadow 0.3s;
        }
        .status-dot.connected {
            background-color: #10b981; /* Green */
            box-shadow: 0 0 8px #10b981;
            animation: pulse-green 2s infinite;
        }
        .status-dot.disconnected {
            background-color: #ef4444; /* Red */
            box-shadow: 0 0 8px #ef4444;
            animation: pulse-red 2s infinite;
        }
        @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes pulse-red {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
    `;
    document.head.appendChild(style);

    // --- WebSocket Connection ---
    function connectWebSocket() {
        console.log('Attempting WS connection...');
        
        // Determine WebSocket URL based on environment
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let wsUrl = isLocal ? 'ws://127.0.0.1:3000/customer' : 'wss://api.mkavs.com/customer';
        
        // If config is available, we can use it to derive the base URL dynamically
        if (typeof MKAVS_CONFIG !== 'undefined' && MKAVS_CONFIG.API_BASE_URL) {
            wsUrl = MKAVS_CONFIG.API_BASE_URL.replace(/^http/, 'ws') + '/customer';
        }

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to Live Chat Server');
            const title = document.querySelector('.panel-header .title');
            if (title) title.innerHTML = 'Kairon <span class="status-dot connected" title="Connected"></span>';
            // Send initial handshake to register customer and get staff list
            ws.send(JSON.stringify({}));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message:', data); // Debug log
                window.handleServerMessage(data);
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Live Chat Server');
            const title = document.querySelector('.panel-header .title');
            if (title) title.innerHTML = 'Kairon <span class="status-dot disconnected" title="Disconnected"></span>';
            setTimeout(connectWebSocket, 3000); // Reconnect
        };

        ws.onerror = (err) => {
            console.error('WS Error:', err);
        };
    }

    window.handleServerMessage = function (data) {
        switch (data.type) {

            // Server assigned us a customerId — store it for outbound messages
            case 'connected':
                ws._customerId = data.customerId;
                break;

            case 'staff_list':
                // Server sends [{name, status, ...}], we need just names of ONLINE agents
                window.onlineAgents = (data.staff || [])
                    .filter(s => s.status === 'online')
                    .map(s => s.name);
                console.log('Online agents updated:', window.onlineAgents);
                break;

            // Server confirmed it is routing the request to an agent
            case 'request_sent':
                appendMessage('Connecting to a live agent. Please wait...', 'system');
                break;

            case 'staff_message':
                appendMessage(data.message, 'agent');
                break;

            // Server could not find an available agent
            case 'no_staff':
                appendMessage('No live agents are currently available. Please leave a message or try again later.', 'system');
                currentAgent = null;
                break;

            // The requested agent was offline or busy
            case 'request_failed':
                appendMessage('The requested agent is unavailable. We are checking for other available agents…', 'system');
                currentAgent = null;
                // Auto-fallback: try any available agent after a short delay
                setTimeout(() => window.requestStaff(null), 1500);
                break;

            // An agent accepted our request
            case 'request_accepted':
                currentAgent = data.staff;
                appendMessage(`You are now connected with ${data.staff}. How can I help?`, 'system');
                break;

            // An agent explicitly declined (new event type)
            case 'request_declined':
                appendMessage(`Agent ${data.staff} is currently unavailable. Trying another agent…`, 'system');
                currentAgent = null;
                // Retry with any available agent after a short delay
                setTimeout(() => window.requestStaff(null), 1500);
                break;

            // Chat was closed by the agent
            case 'closed':
            case 'chat_closed':
                appendMessage('The chat session has ended. Thank you for reaching out!', 'system');
                currentAgent = null;
                break;

            // Chat was transferred to another agent
            case 'transferred':
                appendMessage(`Your chat has been transferred to ${data.toStaff || 'another agent'}.`, 'system');
                currentAgent = data.toStaff || null;
                break;
        }
    }

    connectWebSocket();

    // --- UI Functions ---

    function setOpen(open) {
        if (open) {
            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            setTimeout(() => input.focus(), 300); // Focus after slide-up starts
        } else {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
        }
    }

    window.showTypingIndicator = function() {
        if (document.getElementById('typing-indicator')) return;
        const msg = document.createElement('div');
        msg.id = 'typing-indicator';
        msg.className = 'typing-indicator';
        msg.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    };

    window.hideTypingIndicator = function() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    function typewriter(el, text, speed = 30) {
        return new Promise(resolve => {
            let i = 0;
            el.innerHTML = '';
            el.classList.add('typewriter-cursor');
            
            function type() {
                if (i < text.length) {
                    el.innerHTML += text.charAt(i);
                    i++;
                    messages.scrollTop = messages.scrollHeight;
                    setTimeout(type, speed);
                } else {
                    el.classList.remove('typewriter-cursor');
                    resolve();
                }
            }
            type();
        });
    }

    async function appendMessage(text, type, useTypewriter = false) {
        const el = document.createElement('div');
        el.className = `msg ${type}`;
        
        if (useTypewriter && type === 'bot') {
            messages.appendChild(el);
            await typewriter(el, text);
        } else {
            el.textContent = text;
            messages.appendChild(el);
        }
        messages.scrollTop = messages.scrollHeight;
    }

    async function botReply(text) {
        showTypingIndicator();
        // Simulate thinking time based on message length (min 1s, max 2.5s)
        const delay = Math.min(Math.max(text.length * 15, 1000), 2500);
        await new Promise(r => setTimeout(r, delay));
        hideTypingIndicator();
        await appendMessage(text, 'bot', true);
    }

    // --- Logic Functions ---

    window.requestStaff = function (name) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            appendMessage("Connection to server lost. Reconnecting...", 'system');
            return;
        }

        const priority = ['Mr.K', 'Mr.A', 'Mr.S', 'Mr.V', 'Mr.M'];

        // Step 1 — specific named agent requested and confirmed online
        if (name && window.onlineAgents.includes(name)) {
            ws.send(JSON.stringify({ type: 'request_staff', requestedStaff: name }));
            appendMessage('Connecting to a live agent...', 'system');
            return;
        }

        // Step 2 — try a priority agent if they happen to be online
        const priorityTarget = priority.find(p => window.onlineAgents.includes(p));
        if (priorityTarget) {
            ws.send(JSON.stringify({ type: 'request_staff', requestedStaff: priorityTarget }));
            appendMessage('Connecting to a live agent...', 'system');
            return;
        }

        // Step 3 — ANY online agent (covers 'Live Agent' and other non-priority names).
        // Uses request_any so the server picks the least-loaded available agent.
        if (window.onlineAgents.length > 0) {
            ws.send(JSON.stringify({ type: 'request_any' }));
            appendMessage('Connecting to a live agent...', 'system');
            return;
        }

        // Step 4 — nobody online at all
        appendMessage("No live agents are currently available. Please leave a message or try again later.", 'bot');
        appendMessage("You can email us at support@kairon.com", 'bot');
    };

    function botReplyFor(text) {
        const t = text.trim().toLowerCase();
        if (/\b(hi|hello|hey)\b/.test(t)) return "Hello! How can I assist you?";

        // Search in loaded FAQs
        const match = allFaqs.find(f => f.question.toLowerCase().includes(t));
        if (match) return match.answer;

        return null;
    }

    // --- FAQ LOADING & RENDERING ---

    async function loadFaqData() {
        try {
            const basePath = window.KAIRON_BASE_PATH || '';
            const response = await fetch(basePath + 'kairon-faqs.json');
            if (!response.ok) throw new Error("JSON file not found");
            allFaqs = await response.json();
            console.log("Loaded FAQs:", allFaqs.length);
            renderCategories();
            filterAndRenderFaqs('Pricing'); // Default view
        } catch (error) {
            console.error("Error loading FAQs:", error);
            appendMessage("System: Could not load FAQ data. Please ensure server is running.", 'system');
        }
    }

    function renderCategories() {
        if (!categoriesEl) return;
        categoriesEl.innerHTML = '';

        Object.keys(categoryKeywords).forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-chip';
            btn.textContent = cat;
            btn.onclick = () => filterAndRenderFaqs(cat);
            if (cat === currentCategory) btn.classList.add('active');
            categoriesEl.appendChild(btn);
        });
    }

    function filterAndRenderFaqs(categoryName) {
        if (!faqPane) return;
        faqPane.innerHTML = '';
        currentCategory = categoryName;

        // Update active chip styling
        document.querySelectorAll('.category-chip').forEach(b => {
            b.classList.remove('active');
            if (b.textContent === categoryName) b.classList.add('active');
        });

        // Filter Logic
        const keywords = categoryKeywords[categoryName];
        let filtered = [];

        if (categoryName === 'Support') {
            // Support category: Add "Contact support" button first
            const contactBtn = document.createElement('button');
            contactBtn.className = 'suggestion-btn';
            contactBtn.textContent = 'Contact support';
            contactBtn.onclick = () => {
                appendMessage('Contact support', 'user');
                setTimeout(() => window.requestStaff(), 500);
            };
            faqPane.appendChild(contactBtn);

            // Then add support-related FAQs
            filtered = allFaqs.filter(item => {
                const q = item.question.toLowerCase();
                return keywords.some(k => q.includes(k));
            });
        } else if (keywords && keywords.length > 0) {
            filtered = allFaqs.filter(item => {
                const q = item.question.toLowerCase();
                return keywords.some(k => q.includes(k));
            });
        } else {
            // General category - random selection
            filtered = allFaqs;
        }

        // Show top 5 results to keep UI clean
        filtered.slice(0, 5).forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = item.question;
            btn.onclick = () => handleUserSelection(item);
            faqPane.appendChild(btn);
        });
    }

    function handleUserSelection(item) {
        appendMessage(item.question, 'user');
        setTimeout(() => {
            botReply(item.answer);
        }, 300);
    }

    // --- Initialization ---

    function updateImagePaths() {
        const basePath = window.KAIRON_BASE_PATH || '';
        const images = document.querySelectorAll('#kairon img');
        images.forEach(img => {
            // Force the logo images to use the specific local little.png from kairon live bot folder
            img.setAttribute('src', basePath + 'little.png');
        });
    }

    loadFaqData(); // Load FAQs from JSON
    renderCategories();
    updateImagePaths();

    // Initial Messages
    setTimeout(async () => {
        if (messages.children.length === 0) {
            await botReply("Hi! I'm Kairon. How can I help you today?");
            setTimeout(async () => {
                appendMessage("I'm looking for information about your services.", 'user');
                setTimeout(() => {
                    botReply("Sure! I can help with that. What specifically are you interested in?");
                }, 800);
            }, 1000);
        }
    }, 100);

    // --- Event Listeners ---

    if (btn) btn.addEventListener('click', () => setOpen(true));
    if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false));

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = input.value.trim();
            if (!val) return;

            appendMessage(val, 'user');
            input.value = '';

            if (currentAgent) {
                if (ws) ws.send(JSON.stringify({ type: 'customer_message', message: val }));
                return;
            }

            setTimeout(() => {
                const reply = botReplyFor(val);
                if (reply) {
                    botReply(reply);
                } else {
                    botReply("I'm not sure about that. Checking for available agents...");
                    setTimeout(() => window.requestStaff(), 1000);
                }
            }, 300);
        });
    }

    if (agentSelector) {
        agentSelector.addEventListener('change', (e) => {
            const agent = e.target.value;
            if (agent) window.requestStaff(agent);
            e.target.value = "";
        });
    }
});
