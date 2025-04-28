import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col p-4">
        <div className="border rounded-md overflow-hidden flex flex-col h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
