import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Minus, PlusCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { getColorFromId } from "@/lib/colors";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/app/bill/$billId/item/$itemId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { billId, itemId } = params;

    const response = await apiClient.bill[":billId"].items[":itemId"].$get({
      param: { billId, itemId },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bill item");
    }

    return response.json();
  },
});

export default function RouteComponent() {
  const navigate = Route.useNavigate();
  const { billId, itemId } = Route.useParams();
  const { billItem, userVotes } = Route.useLoaderData();
  const [voters, setVoters] = useState(userVotes);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const router = useRouter();

  const { mutateAsync: updateVotes } = useMutation({
    mutationFn: async () => {
      await apiClient.bill[":billId"].items[":itemId"].edit.$post({
        param: { billId, itemId },
        json: voters,
      });
    },
    onSuccess: () => {
      router.invalidate();
    },
  });

  // Prepare data for pie chart
  const chartData = voters.map((voter) => ({
    name: voter.userId,
    value: voter.share,
    color: getColorFromId(Number(voter.userId)),
  }));

  // Handle share increment/decrement
  const updateShares = (userId: number, increment: boolean) => {
    setVoters((prev) =>
      prev.map((voter) => {
        console.log(voter.userId, userId);
        if (voter.userId === userId) {
          const newShare = increment
            ? voter.share + 1
            : Math.max(1, voter.share - 1);
          return { ...voter, share: newShare };
        }
        return voter;
      }),
    );
  };

  const addPerson = () => {
    // const person = additionalPeople.find((p) => p.id.toString() === personId);
    // if (person) {
    //   setVoters((prev) => [...prev, { ...person, shares: 1 }]);
    //   setShowAddPeople(false);
    // }
  };

  const handleSave = async () => {
    // TODO: save the data here
    await updateVotes();
    navigate({ to: "../../results" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col">
        <div className="border rounded-md overflow-hidden flex flex-col h-full">
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
            <span className="font-bold text-xl">${billItem.priceTotal}</span>
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
                  key={voter.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      className={`w-6 h-6 avatar-transition`}
                      style={{
                        backgroundColor: getColorFromId(Number(voter.userId)),
                      }}
                    />

                    <span className="text-lg">{voter.userId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateShares(voter.userId, false)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Decrease share"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 border rounded-md flex items-center justify-center">
                      {voter.share}
                    </div>
                    <button
                      onClick={() => updateShares(voter.userId, true)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Increase share"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add more people button */}
              <Dialog open={showAddPeople} onOpenChange={setShowAddPeople}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-3 text-gray-500 hover:text-gray-700 mt-2">
                    <Avatar className="w-6 h-6 bg-gray-200">
                      <AvatarFallback>
                        <PlusCircle className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span>Add more people</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Person</DialogTitle>
                  </DialogHeader>
                  <Select onValueChange={addPerson}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {voters
                        .filter(
                          (person) =>
                            !voters.some((v) => v.userId === person.userId),
                        )
                        .map((person) => (
                          <SelectItem
                            key={person.userId}
                            value={person.userId.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full`}
                                style={{
                                  backgroundColor: getColorFromId(
                                    Number(person.userId),
                                  ),
                                }}
                              />
                              {person.userId}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </DialogContent>
              </Dialog>
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
        </div>
      </main>
    </div>
  );
}
