import { hc } from "hono/client";
import type { ApiRouter } from "../worker/routes/api";
import { retrieveRawInitData } from "@telegram-apps/sdk-react";

// FIXME: won't work in SSR environment
const tgRawInitData = retrieveRawInitData();

export const apiClient = hc<ApiRouter>("/api/client", {
  headers: {
    Authorization: `tma ${tgRawInitData}`, // FIXME: could be undefined
  },
});
