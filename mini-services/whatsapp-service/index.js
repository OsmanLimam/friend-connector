const { Server } = require('socket.io');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3003;

const io = new Server(PORT, {
  cors: { origin: '*' },
  transports: ['websocket'],
});

console.log(`WhatsApp Service running on port ${PORT}`);

let sock = null;
let authState = null;

const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, 'auth-info-baileys');

async function connectWhatsApp() {
  try {
    authState = await useMultiFileAuthState(AUTH_DIR);
    
    sock = makeWASocket({
      auth: authState.state,
      printQROnTerminal: false,
      logger: require('pino')({ level: 'silent' }),
      browser: ['Friend Connector', 'Chrome', '1.0.0'],
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('QR Code received - scan with WhatsApp');
        qrcode.generate(qr, { small: true });
        // Send QR to frontend as base64 data URL
        try {
          const QRCode = require('qrcode');
          const qrDataUrl = await QRCode.toDataURL(qr);
          io.emit('qr', qrDataUrl);
        } catch (e) {
          // Fallback: send raw QR string
          io.emit('qr', qr);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed. Reconnecting:', shouldReconnect);
        io.emit('disconnected');
        
        if (shouldReconnect) {
          connectWhatsApp();
        }
      } else if (connection === 'open') {
        console.log('WhatsApp Connected!');
        io.emit('connected');
      }
    });

    sock.ev.on('creds.update', authState.saveCreds);

  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Frontend connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Frontend disconnected:', socket.id);
  });

  // Get all groups
  socket.on('get-groups', async () => {
    try {
      if (!sock) {
        socket.emit('groups', []);
        return;
      }

      const groups = await sock.groupFetchAllParticipating();
      const entries = Object.entries(groups);

      // Fetch full metadata in small batches so member counts are accurate
      // (list query alone can return lite metadata with only a few participants)
      const metas = [];
      for (let i = 0; i < entries.length; i += 10) {
        const batch = entries.slice(i, i + 10);
        const results = await Promise.all(
          batch.map(([id]) => sock.groupMetadata(id).catch(() => null))
        );
        metas.push(...results);
      }

      const groupList = entries.map(([id, group], idx) => {
        const meta = metas[idx] || group;
        return {
          id,
          name: meta.subject || group.subject || 'Unknown Group',
          participantCount: meta.participants?.length || group.participants?.length || 0,
          participants: [],
        };
      });

      console.log(`Found ${groupList.length} groups`);
      socket.emit('groups', groupList);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      socket.emit('groups', []);
    }
  });

  // Extract contacts from selected groups
  socket.on('extract-contacts', async (data) => {
    try {
      const { groupIds } = data;
      if (!sock || !groupIds?.length) return;

      const groups = await sock.groupFetchAllParticipating();
      let allContacts = [];

      for (const groupId of groupIds) {
        let group = groups[groupId];
        let participants = (group && group.participants) ? [...group.participants] : [];

        // groupFetchAllParticipating can return lite metadata with only a few
        // participants. Fetch full metadata per group and merge for the complete list.
        try {
          const full = await sock.groupMetadata(groupId);
          if (full?.participants?.length) {
            const seen = new Set(participants.map((p) => p.id));
            for (const p of full.participants) {
              if (!seen.has(p.id)) {
                participants.push(p);
                seen.add(p.id);
              }
            }
          }
        } catch (e) {
          // Full metadata unavailable, fall back to what we already have
        }

        const contacts = participants
          .map((p) => ({
            id: p.id,
            name: '', // Baileys doesn't provide names in group metadata
            number: p.id.split('@')[0],
            numberFull: p.id,
          }));

        // Try to get contact names from store
        try {
          const store = await sock.store?.contacts;
          if (store) {
            contacts.forEach((c) => {
              const contactInfo = store[c.numberFull];
              if (contactInfo?.notify) {
                c.name = contactInfo.notify;
              }
            });
          }
        } catch (e) {
          // Contact names not available, that's ok
        }

        allContacts = [...allContacts, ...contacts];
        socket.emit('contacts-extracted', {
          groupId,
          contacts,
        });
      }

      console.log(`Extracted ${allContacts.length} contacts from ${groupIds.length} groups`);
    } catch (error) {
      console.error('Failed to extract contacts:', error);
    }
  });

  // Bulk send messages
  socket.on('bulk-send', async (data) => {
    const { contacts, message, delay = 3 } = data;
    if (!sock || !contacts?.length) return;

    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const digits = String(contact.number || '').replace(/\D/g, '');
        const jid = contact.number.includes('@') ? contact.number : `${digits}@s.whatsapp.net`;
        
        await sock.sendMessage(jid, { text: message });
        sent++;
        
        socket.emit('message-sent', { contactId: contact.id });
        socket.emit('bulk-progress', {
          total: contacts.length,
          sent,
          failed,
          current: contact.name || contact.number,
          isRunning: true,
        });

        console.log(`Sent to ${contact.name || contact.number} (${sent}/${contacts.length})`);
        
        // Rate limiting delay
        await new Promise((r) => setTimeout(r, delay * 1000));
      } catch (error) {
        failed++;
        socket.emit('message-failed', { contactId: contact.id });
        console.error(`Failed to send to ${contact.number}:`, error.message);
      }
    }

    socket.emit('bulk-progress', {
      total: contacts.length,
      sent,
      failed,
      current: 'Done!',
      isRunning: false,
    });

    console.log(`Bulk send complete: ${sent} sent, ${failed} failed`);
  });
});

// Start WhatsApp connection
connectWhatsApp();
