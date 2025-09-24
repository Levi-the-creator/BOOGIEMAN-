// index.js
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

const logger = pino({ level: 'info' })

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    logger,
    auth: state,
    version,
    printQRInTerminal: true
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      qrcode.generate(qr, { small: true })
      console.log('Scan this QR code in WhatsApp to connect.')
    }
    if (connection === 'open') {
      console.log('✅ BOOGIEMAN connected to WhatsApp!')
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode
      console.log('❌ Connection closed. Code:', code)
      if (code !== DisconnectReason.loggedOut) {
        startBot() // auto-reconnect if not logged out
      } else {
        console.log('⚠️ Logged out. Delete auth folder and restart.')
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // Basic message handler
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg || msg.key.fromMe) return
      const from = msg.key.remoteJid
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
      console.log('📩 Message from', from, ':', text)

      if (!text) return
      if (text.toLowerCase() === 'hi') {
        await sock.sendMessage(from, { text: 'Hello 👋, I am BOOGIEMAN Bot!' })
      }
    } catch (err) {
      console.error('Message handler error:', err)
    }
  })
}

startBot().catch(err => console.error('Fatal error:', err))