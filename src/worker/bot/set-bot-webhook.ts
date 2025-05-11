import { Api } from "grammy";
import { env } from "cloudflare:workers";
import { APP_URL } from "../../lib/constants";

export const setBotWebhook = async () => {
  const botApi = new Api(env.BOT_TOKEN);

  console.log("Setting bot webhook", `${APP_URL}/api/bot`);
  botApi
    .setWebhook(`${APP_URL}/api/bot`)
    .then(() => {
      console.log("Bot webhook set to", `${APP_URL}/api/bot`);
    })
    .catch((err) => {
      console.error("Error setting bot webhook", err);
    });
};
