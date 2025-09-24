import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger.js"

const logger = MAIN_LOGGER.child({})
logger.level = 'silent'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false // disable QR
    })

    // 🔹 pairing code
    if (!sock.authState.creds.registered) {
        let phoneNumber = process.env.NUMBER || ""  // set your phone number in env
        if (!phoneNumber) {
            console.log("Enter your WhatsApp number including country code, e.g. 2348123456789:")
            process.stdin.once("data", async (input) => {
                phoneNumber = input.toString().trim()
                let code = await sock.requestPairingCode(phoneNumber)
                console.log("Your pairing code:", code)
            })
        } else {
            let code = await sock.requestPairingCode(phoneNumber)
            console.log("Your pairing code:", code)
        }
    }

    sock.ev.on("creds.update", saveCreds)
}

startBot()
