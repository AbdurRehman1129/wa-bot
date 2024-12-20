const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const store = {};

const getMessage = key => {
    const { id } = key;
    if (store[id]) return store[id].message; // Fixing this line
};

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        version: version,
        getMessage
    });

    sock.ev.process(async events => {
        if (events['connection.update']) {
            const { connection, lastDisconnect } = events['connection.update'];
            if (connection === 'close') { // Fixed the condition
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    connectWhatsApp(); // Recursively calling the function to reconnect
                } else {
                    console.log("Disconnected because you have logged out.");
                }
            }
        }
        if (events['creds.update']) {
            await saveCreds(); // Saving credentials when updated
        }
        if (events['messages.upsert']) {
            const { messages } = events['messages.upsert']; // Fixing this line
            messages.forEach(message => {
                console.log(message); // Logging received messages
            });
        }
    });
}

connectWhatsApp();
