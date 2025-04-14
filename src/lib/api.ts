import { hc } from "hono/client";
import { ApiRouter } from "../worker/routes/api";

export const apiClient = hc<ApiRouter>("/api/client");
