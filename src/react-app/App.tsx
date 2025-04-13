import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sample data for food items and voters
const foodItems = [
  {
    id: 1,
    name: "Pizza",
    voters: [
      { id: 1, color: "bg-pink-300" },
      { id: 2, color: "bg-yellow-300" },
    ],
  },
  { id: 2, name: "Cappicino", voters: [] },
  { id: 3, name: "Salad", voters: [{ id: 3, color: "bg-yellow-300" }] },
  { id: 4, name: "Carrot cake", voters: [{ id: 4, color: "bg-pink-300" }] },
];

export default function ItemSelectionPage() {
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
      // router.push("/results");
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
            {foodItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border-b cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      selectedItems.includes(item.id)
                        ? "border-blue-400 bg-blue-400"
                        : "border-gray-400",
                    )}
                  >
                    {selectedItems.includes(item.id) && (
                      <div className="w-4 h-4 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-lg">{item.name}</span>
                </div>

                {item.voters.length > 0 && (
                  <div className="flex -space-x-2">
                    {item.voters.map((voter) => (
                      <Avatar
                        key={voter.id}
                        className={`w-6 h-6 ${voter.color} avatar-transition`}
                      >
                        <AvatarFallback className="text-xs"></AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
