import { createFileRoute } from "@tanstack/react-router";
import type React from "react";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/bill/$billId/summary")({
  component: RouteComponent,
});

// Define consistent colors
const COLORS = {
  DAN: "bg-green-200",
  KSENDJI: "bg-yellow-200",
  ILYA: "bg-pink-200",
};

// Sample data for users and their shares
const initialUsers = [
  { id: 1, name: "Dan", color: COLORS.DAN, amount: 15 },
  { id: 2, name: "Ksendji", color: COLORS.KSENDJI, amount: 13 },
  { id: 3, name: "Ilya", color: COLORS.ILYA, amount: 13 },
];

export default function RouteComponent() {
  const navigate = Route.useNavigate();
  const [users, setUsers] = useState(initialUsers);
  const [coefficient, setCoefficient] = useState<string>("1.00");
  const [originalTotal, setOriginalTotal] = useState(0);
  const [adjustedTotal, setAdjustedTotal] = useState(0);

  // Calculate totals on component mount and when users change
  useEffect(() => {
    const total = users.reduce((sum, user) => sum + user.amount, 0);
    setOriginalTotal(total);
    updateAdjustedTotal(total, coefficient);
  }, [users, coefficient]);

  // Update the adjusted total when coefficient changes
  const updateAdjustedTotal = (total: number, coef: string) => {
    const coefValue = Number.parseFloat(coef) || 1;
    setAdjustedTotal(total * coefValue);
  };

  // Handle coefficient change
  const handleCoefficientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setCoefficient(value);
      updateAdjustedTotal(originalTotal, value);
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    navigate({ to: "../" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col">
        <div className="border rounded-md overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-2xl font-bold title-transition">Result</h1>
            <button
              onClick={handleEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              Edit
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {/* Users list */}
            <div className="space-y-4 mb-8">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      className={`w-6 h-6 ${user.color} avatar-transition`}
                    >
                      <AvatarFallback className="text-xs"></AvatarFallback>
                    </Avatar>
                    <span className="text-lg">{user.name}</span>
                  </div>
                  <span className="font-medium">
                    $
                    {(
                      user.amount * (Number.parseFloat(coefficient) || 1)
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coefficient input */}
            <div className="mt-auto pt-8">
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="coefficient" className="text-lg">
                  Add coef?
                </label>
                <div className="w-24">
                  <Input
                    id="coefficient"
                    type="text"
                    value={coefficient}
                    onChange={handleCoefficientChange}
                    className="text-right"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold">
                  ${adjustedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Complete Button */}
          <div className="p-4 mt-auto">
            <Button className="w-full py-6 text-lg bg-blue-400 hover:bg-blue-500 button-transition">
              Complete
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
