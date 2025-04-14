import { createFileRoute } from "@tanstack/react-router";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";

function getColorFromId(id: number): string {
  // Use the id as a seed for pseudo-random generation
  const seed = Math.abs(id) % 16777215; // 16777215 is FFFFFF in decimal

  // Convert to hex and pad with zeros if needed
  let color = seed.toString(16).padStart(6, "0");

  // Ensure reasonable contrast by adjusting brightness if too dark or light
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);

  // Calculate perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness < 128) {
    // Too dark, make it lighter
    color = color.replace(/./g, (c) =>
      Math.min(parseInt(c, 16) + 2, 15).toString(16),
    );
  } else if (brightness > 225) {
    // Too light, make it darker
    color = color.replace(/./g, (c) =>
      Math.max(parseInt(c, 16) - 2, 0).toString(16),
    );
  }

  return `#${color}`;
}

export const Route = createFileRoute("/app/bill/$chatId/$messageId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { chatId, messageId } = params;
    console.log(chatId, messageId);
    const response = await apiClient.bill[":chatId"][":messageId"].$get({
      param: {
        chatId,
        messageId,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bill");
    }

    return response.json();
  },
});

function RouteComponent() {
  const { bill, votes } = Route.useLoaderData();

  const navigate = Route.useNavigate();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const toggleItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const hasSelections = selectedItems.length > 0;

  const handleDone = () => {
    if (hasSelections) {
      navigate({ to: "./results" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col p-4">
        <div className="border rounded-md overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold title-transition">
              Choose your items
            </h1>
            <p className="text-gray-700">
              Just select what you ate. It will be split later.
            </p>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-auto">
            {bill.items.map((item, itemIndex) => {
              const voters = Object.entries(votes)
                .filter(([voterId, votes]) => votes.includes(itemIndex))
                .map(([voterId]) => voterId);
              return (
                <div
                  key={`${item.nameEnglish}-${itemIndex}`}
                  className="flex items-center justify-between p-4 border-b cursor-pointer"
                  onClick={() => toggleItem(itemIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        selectedItems.includes(itemIndex)
                          ? "border-blue-400 bg-blue-400"
                          : "border-gray-400",
                      )}
                    >
                      {selectedItems.includes(itemIndex) && (
                        <div className="w-4 h-4 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-lg">{item.nameEnglish}</span>
                  </div>

                  {voters.length > 0 && (
                    <div className="flex -space-x-2">
                      {voters.map((voter) => (
                        <Avatar
                          key={voter}
                          className={`w-6 h-6 avatar-transition`}
                          style={{
                            backgroundColor: getColorFromId(Number(voter)),
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Button */}
          <div className="p-4 mt-auto">
            <Button
              className={cn(
                "w-full py-6 text-lg button-transition",
                hasSelections
                  ? "bg-blue-400 hover:bg-blue-500"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800",
              )}
              onClick={handleDone}
            >
              {hasSelections ? "Done" : "Skip"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
