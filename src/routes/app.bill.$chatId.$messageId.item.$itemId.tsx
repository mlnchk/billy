import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute(
  "/app/bill/$chatId/$messageId/item/$itemId",
)({
  component: RouteComponent,
});

// Define consistent colors
const COLORS = {
  DAN: "bg-green-200",
  KSENDJI: "bg-yellow-200",
  ILYA: "bg-pink-200",
  ALEX: "bg-purple-200",
  JAMIE: "bg-blue-200",
  TAYLOR: "bg-orange-200",
};

// Color mapping for pie chart
const COLOR_MAP = {
  "green-200": "#86efac",
  "yellow-200": "#fef08a",
  "pink-200": "#fbcfe8",
  "purple-200": "#e9d5ff",
  "blue-200": "#bfdbfe",
  "orange-200": "#fed7aa",
};

// Initial voters data
const initialVoters = [
  { id: 1, name: "Dan", color: COLORS.DAN, shares: 1 },
  { id: 2, name: "Ksendji", color: COLORS.KSENDJI, shares: 1 },
  { id: 3, name: "Ilya", color: COLORS.ILYA, shares: 1 },
];

// Additional people who can be added
const additionalPeople = [
  { id: 4, name: "Alex", color: COLORS.ALEX },
  { id: 5, name: "Jamie", color: COLORS.JAMIE },
  { id: 6, name: "Taylor", color: COLORS.TAYLOR },
];

export default function RouteComponent() {
  const params = Route.useParams();
  const navigate = Route.useNavigate();
  const [voters, setVoters] = useState(initialVoters);
  const [showAddPeople, setShowAddPeople] = useState(false);

  // Item details (would come from API/database in a real app)
  const itemDetails = {
    id: params.id,
    name: "Pizza",
    price: 18,
  };

  // Calculate total shares
  // const totalShares = voters.reduce((sum, voter) => sum + voter.shares, 0);

  // Prepare data for pie chart
  const chartData = voters.map((voter) => ({
    name: voter.name,
    value: voter.shares,
    color: voter.color.replace("bg-", ""),
  }));

  // Handle share increment/decrement
  const updateShares = (id: number, increment: boolean) => {
    setVoters((prev) =>
      prev.map((voter) => {
        if (voter.id === id) {
          const newShares = increment
            ? voter.shares + 1
            : Math.max(1, voter.shares - 1);
          return { ...voter, shares: newShares };
        }
        return voter;
      }),
    );
  };

  // Add a new person to the voters list
  const addPerson = (personId: string) => {
    const person = additionalPeople.find((p) => p.id.toString() === personId);
    if (person) {
      setVoters((prev) => [...prev, { ...person, shares: 1 }]);
      setShowAddPeople(false);
    }
  };

  // Handle save and return to the Split screen
  const handleSave = () => {
    // In a real app, you would save the data here
    navigate({ to: "../../results" });
  };

  // Get color for pie chart
  const getColorForChart = (colorName: string) => {
    return COLOR_MAP[colorName] || "#cccccc";
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col">
        <div className="border rounded-md overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ to: "../.." })}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold title-transition">
                {itemDetails.name}
              </h1>
            </div>
            <span className="font-bold text-xl">${itemDetails.price}</span>
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
                  key={voter.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      className={`w-6 h-6 ${voter.color} avatar-transition`}
                    >
                      <AvatarFallback className="text-xs"></AvatarFallback>
                    </Avatar>
                    <span className="text-lg">{voter.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateShares(voter.id, false)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Decrease share"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 border rounded-md flex items-center justify-center">
                      {voter.shares}
                    </div>
                    <button
                      onClick={() => updateShares(voter.id, true)}
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
                      {additionalPeople
                        .filter(
                          (person) => !voters.some((v) => v.id === person.id),
                        )
                        .map((person) => (
                          <SelectItem
                            key={person.id}
                            value={person.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${person.color}`}
                              ></div>
                              {person.name}
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
                    label={({ name, color }) => (
                      <g>
                        <circle
                          cx={0}
                          cy={0}
                          r={10}
                          fill={getColorForChart(color)}
                        />
                      </g>
                    )}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorForChart(entry.color)}
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
