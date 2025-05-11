import { mockTelegramEnv as _mockTelegramEnv } from "@telegram-apps/sdk-react";

const themeParams = {
  accent_text_color: "#6ab2f2",
  bg_color: "#17212b",
  button_color: "#5288c1",
  button_text_color: "#ffffff",
  destructive_text_color: "#ec3942",
  header_bg_color: "#17212b",
  hint_color: "#708499",
  link_color: "#6ab3f3",
  secondary_bg_color: "#232e3c",
  section_bg_color: "#17212b",
  section_header_text_color: "#6ab3f3",
  subtitle_text_color: "#708499",
  text_color: "#f5f5f5",
} as const;

// Create a structured URLSearchParams for Telegram Web App initialization data
const initDataRaw = new URLSearchParams([
  ["auth_date", ""],
  ["hash", ""],
  ["query_id", ""],
  ["signature", ""],
  [
    "user",
    JSON.stringify({
      allows_write_to_pm: true,
      first_name: "Dan",
      id: 43044295,
      last_name: "",
      language_code: "en",
      photo_url:
        "https://t.me/i/userpic/320/SVKUoV20JCuWbIK6swQ8p6iPWX0MNtoi8CNZYKxmjkE.svg",
      username: "mlnchk",
    }),
  ],
]).toString();

export function mockTelegramEnv() {
  _mockTelegramEnv({
    launchParams: {
      tgWebAppThemeParams: themeParams,
      tgWebAppData: initDataRaw,
      tgWebAppStartParam: "debug",
      tgWebAppVersion: "8",
      tgWebAppPlatform: "tdesktop",
    },
  });
}
