import { initTelegramEnv } from "@/lib/telegram";

import { Outlet, createRootRoute } from "@tanstack/react-router";

initTelegramEnv();

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col md:p-4">
        <div className="md:border md:rounded-md overflow-hidden flex flex-col h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
