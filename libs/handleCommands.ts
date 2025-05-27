import type { Message } from "whatsapp-web.js";
import { fetchWithAutoLogin } from "./apiWrapper";
let args: string[] = [];

// Define command handlers
const handleInfo = async (message: Message) => {
  if (args.length < 2) {
    message.reply("Usage: !info <username>");
    return;
  };

  try {
    const dataRes = await fetchWithAutoLogin(
      `https://${Bun.env.HOST}:${Bun.env.PORT}/panel/api/inbounds/getClientTraffics/${args[1]}`
    );
    const data = (await dataRes.json()) as { obj: any };

    if (!data.obj) {
      message.reply("No data found for the specified username.");
      return;
    }

    const date = new Date(data.obj.expiryTime);

    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);
    const expireDate = data.obj == 0 ? "♾️" : formattedDate;
    const total = data.obj.total == 0 ? "♾️" : bytesToGB(data.obj.total);
    const upload = bytesToGB(data.obj.up);
    const download = bytesToGB(data.obj.down);
    const remaining =
      data.obj.total == 0
        ? "♾️"
        : bytesToGB(data.obj.total - (data.obj.up + data.obj.down));

    const messageContent = `*Username:* ${args[1]}\n*Expiry Date:* ${expireDate}\n*Total Traffic:* ${total} GB\n*Upload:* ${upload} GB\n*Download:* ${download} GB\n*Remaining:* ${remaining} GB`;
    message.reply(messageContent);
  } catch (error) {
    console.error("Error handling info command:", error);
    message.reply("An error occurred while processing the info command.");
  }
};

// Explicitly type the commands object
const commands: Record<string, (message: Message) => void> = {
  info: handleInfo,
};

export const handleCommands = (message: Message) => {
  args = message.body.trim().split(" ");
  if (!args || args.length === 0) {
    message.reply("No command provided");
    return;
  }

  if (args == undefined) return;

  const commandName = args[0].startsWith("!") ? args[0].substring(1) : args[0];

  const commandFn = commands[commandName];

  if (commandFn) {
    commandFn(message, ...args);
  } else {
    message.reply("Unknown command");
  }
};

function bytesToGB(bytes) {
  return (bytes / 1024 ** 3).toFixed(2); // 2 decimal places
}
