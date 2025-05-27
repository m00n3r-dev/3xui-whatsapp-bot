import { Client, LocalAuth } from "whatsapp-web.js";
import { handleCommands } from "./libs/handleCommands";

const qrcode = require("qrcode-terminal");

const client: Client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp Web JS is ready!");
});

client.on("message", async (message) => {
  if (!message.body || !message.body.startsWith("!")) return;
  handleCommands(message);
});

client.initialize();
