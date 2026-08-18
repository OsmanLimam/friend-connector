# Friend Connector

Extract contacts from WhatsApp groups and send connect messages to make new friends.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
npx prisma generate
npx prisma db push

# 3. Install WhatsApp service dependencies
cd mini-services/whatsapp-service
npm install
cd ../..

# 4. Start the app
npm run dev

# 5. Open http://localhost:3000
```

## How to Use

1. **Demo Mode**: Toggle "Demo Mode" in the top-right to test with simulated data
2. **Real WhatsApp**: Turn off Demo Mode, click "Connect WhatsApp", and scan the QR code
3. **Groups Tab**: Load your groups, select the ones you want, and click "Extract Contacts"
4. **Message Tab**: Choose a message template or write custom, set delay between messages
5. **Contacts Tab**: Select contacts, then send connect messages or save them

## Starting WhatsApp Service (for real WhatsApp connection)

In a separate terminal:
```bash
cd mini-services/whatsapp-service
node index.js
```

This runs on port 3003 and connects to WhatsApp via Baileys.

## Features

- 🔗 WhatsApp Web connection via QR code
- 👥 Extract contacts from any group
- 💬 Customizable connect message templates
- ⏱️ Rate limiting (2-10 sec delays) to avoid WhatsApp restrictions
- 💾 Save contacts with status tracking
- 🎮 Demo mode for testing without real WhatsApp

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **State**: Zustand
- **Database**: Prisma + SQLite
- **WhatsApp**: @whiskeysockets/baileys + Socket.io

## Disclaimer

This tool is for making genuine friendships. Use responsibly. Respect people's privacy and WhatsApp's terms of service. Do not use for spam or marketing.
