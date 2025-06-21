import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { trpc } from "@/router";
import { getColorFromId } from "@/lib/colors";
import { useMutation } from "@tanstack/react-query";
import { getCurrencySymbol } from "@/lib/currency";

export const Route = createFileRoute("/app/bill/$billId/item/$itemId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { billId, itemId } = params;

    return trpc.bill.getItem.query({ itemId: Number(itemId) });
  },
});

export default function RouteComponent() {
  const navigate = Route.useNavigate();
  const { billId, itemId } = Route.useParams();
  const { billItem, userVotes, bill } = Route.useLoaderData();
  const currencySymbol = getCurrencySymbol(bill.currency);
  const [voters, setVoters] = useState(userVotes);
  const router = useRouter();

  const { mutateAsync: updateVotes } = useMutation({
    mutationFn: async () => {
      await trpc.bill.editItem.mutate({
        itemId: Number(itemId),
        votes: voters,
      });
    },
    onSuccess: () => {
      router.invalidate();
    },
  });

  // Prepare data for pie chart
  const chartData = voters.map((voter) => ({
    name: voter.user.name ?? voter.userId,
    value: voter.share,
    color: getColorFromId(Number(voter.user.id)),
  }));

  // Handle share increment/decrement
  const updateShares = (userId: number, increment: boolean) => {
    setVoters((prev) =>
      prev.map((voter) => {
        if (voter.user.id === userId) {
          const newShare = increment
            ? voter.share + 1
            : Math.max(1, voter.share - 1);
          return { ...voter, share: newShare };
        }
        return voter;
      }),
    );
  };

  const handleSave = async () => {
    // TODO: save the data here
    await updateVotes();
    navigate({ to: "../../results" });
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "../../results" })}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold title-transition">
            {billItem.nameEnglish}
          </h1>
        </div>
        <span className="font-bold text-xl">
          {currencySymbol}
          {billItem.priceTotal}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Shares label */}
        <div className="flex justify-end px-4 py-2">
          <span className="text-sm text-gray-500">shares</span>
        </div>

        {/* Voters list */}
        <div className="px-4 space-y-3">
          {voters.map((voter) => (
            <div
              key={voter.user.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  className={`w-6 h-6 avatar-transition`}
                  style={{
                    backgroundColor: getColorFromId(Number(voter.user.id)),
                  }}
                >
                  <AvatarImage
                    src={voter.user.photoUrl ?? undefined}
                    alt={voter.user.name ?? undefined}
                  />
                </Avatar>

                <span className="text-lg">
                  {voter.user.name ?? voter.userId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateShares(voter.user.id, false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Decrease share"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 border rounded-md flex items-center justify-center">
                  {voter.share}
                </div>
                <button
                  onClick={() => updateShares(voter.user.id, true)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Increase share"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 mt-auto">
        <Button
          onClick={handleSave}
          className="w-full py-6 text-lg bg-blue-400 hover:bg-blue-500 button-transition"
        >
          Save
        </Button>
      </div>
    </>
  );
}
