import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { getColorFromId } from "@/lib/colors";
import { Avatar } from "@/components/ui/avatar";

export const Route = createFileRoute("/app/bill/$billId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { billId } = params;

    const response = await apiClient.bill[":billId"].$get({
      param: { billId },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bill");
    }

    return response.json();
  },
});

function RouteComponent() {
  const { bill, votes } = Route.useLoaderData();
  const { billId } = Route.useParams();
  const router = useRouter();

  const navigate = Route.useNavigate();
  // TODO: add default values from loader data
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const { mutateAsync: updateVotes, isPending: isUpdatingVotes } = useMutation({
    async mutationFn() {
      const response = await apiClient.bill[":billId"].vote.$post({
        param: { billId },
        json: { itemIds: selectedItemIds },
      });

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

  const handleDone = async () => {
    if (hasSelections) {
      await updateVotes();
    }

    navigate({ to: "./results" });
  };

  return (
    <>
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
        {bill.billItems.map((item) => {
          const itemId = item.id;
          const voters = votes
            .filter((vote) => vote.billItemId === itemId)
            .map((vote) => vote.userId);
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
          disabled={isUpdatingVotes}
        >
          {isUpdatingVotes ? "Updating..." : hasSelections ? "Done" : "Skip"}
        </Button>
      </div>
    </>
  );
}
