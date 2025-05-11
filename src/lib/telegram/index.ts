import { mockTelegramEnv } from "@/lib/telegram/mock";

import { init, isTMA } from "@telegram-apps/sdk-react";

export function initTelegramEnv() {
  if (!isTMA()) {
    return;
  }

  if (!import.meta.env.PROD) {
    mockTelegramEnv();
  }

  init();
}
