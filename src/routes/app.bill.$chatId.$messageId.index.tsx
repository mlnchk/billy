import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { getColorFromId } from "@/lib/colors";
import { Avatar } from "@/components/ui/avatar";
import { MY_ID } from "@/lib/constants";

export const Route = createFileRoute("/app/bill/$chatId/$messageId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { chatId, messageId } = params;

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
  const { chatId, messageId } = Route.useParams();
  const router = useRouter();

  const navigate = Route.useNavigate();
  // TODO: add default values from loader data
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const { mutate: updateVotes } = useMutation({
    async mutationFn() {
      const response = await apiClient.bill[":chatId"][":messageId"].vote.$post(
        {
          param: { chatId, messageId },
          // TODO: replace my id with the user id from telegram api
          json: { userId: MY_ID, itemIds: selectedItemIds },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update votes");
      }

      return response.json();
    },

    onSuccess() {
      router.invalidate();
    },
  });

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const hasSelections = selectedItemIds.length > 0;

  const handleDone = () => {
    if (hasSelections) {
      updateVotes();
    }

    navigate({ to: "./results" });
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
            {bill.items.map((item) => {
              const itemId = item.id;
              const voters = Object.entries(votes)
                .filter(([, votes]) => votes.includes(itemId))
                .map(([voterId]) => voterId);
              return (
                <div
                  key={`${item.nameEnglish}-${itemId}`}
                  className="flex items-center justify-between p-4 border-b cursor-pointer"
                  onClick={() => toggleItem(itemId)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        selectedItemIds.includes(itemId)
                          ? "border-blue-400 bg-blue-400"
                          : "border-gray-400",
                      )}
                    >
                      {selectedItemIds.includes(itemId) && (
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
