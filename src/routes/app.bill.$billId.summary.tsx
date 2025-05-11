import { createFileRoute } from "@tanstack/react-router";
import type React from "react";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { getColorFromId } from "@/lib/colors";

export const Route = createFileRoute("/app/bill/$billId/summary")({
  component: RouteComponent,
  loader: async ({ params }) => {
    // TODO: get bill with results
    const { billId } = params;
    const response = await apiClient.bill[":billId"].results.$get({
      param: { billId },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch results");
    }

    return response.json();
  },
});

export default function RouteComponent() {
  const navigate = Route.useNavigate();
  const { userSelections, bill } = Route.useLoaderData();
  const defaultCoefficient = bill.subtotal ? bill.total / bill.subtotal : 1;

  const [coefficient, setCoefficient] = useState(defaultCoefficient);

  const adjustedTotal = bill.subtotal
    ? bill.subtotal * coefficient
    : bill.total;

  // Handle coefficient change
  const handleCoefficientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 1;

    setCoefficient(value);
  };

  // Handle edit button click
  const handleEdit = () => {
    navigate({ to: ".." });
  };

  return (
    <>
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
          {Object.entries(userSelections).map(([userId, user]) => (
            <div key={userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  color={getColorFromId(Number(userId))}
                  className={`w-6 h-6 avatar-transition`}
                >
                  <AvatarFallback className="text-xs"></AvatarFallback>
                </Avatar>
                <span className="text-lg">{userId}</span>
              </div>
              <span className="font-medium">
                ${(user.total * coefficient).toFixed(2)}
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
                type="number"
                step="0.001"
                placeholder="1.00"
                value={coefficient}
                onChange={handleCoefficientChange}
                className="text-right"
              />
            </div>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-lg">Subtotal</span>
            <span className="text-lg">${bill.subtotal?.toFixed(2)}</span>
          </div>

          {/* Adjusted subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-lg">Adjusted subtotal</span>
            <span className="text-lg">${adjustedTotal.toFixed(2)}</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">Total</span>
            <span className="text-xl font-bold">${bill.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="p-4 mt-auto">
        <Button className="w-full py-6 text-lg bg-blue-400 hover:bg-blue-500 button-transition">
          Complete
        </Button>
      </div>
    </>
  );
}
