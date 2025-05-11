import { useLaunchParams } from "@telegram-apps/sdk-react";

export function useTelegramUser() {
  const { tgWebAppData } = useLaunchParams();

  const user = tgWebAppData?.user;

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
