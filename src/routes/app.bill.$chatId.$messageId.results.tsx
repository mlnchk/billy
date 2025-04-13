import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/bill/$chatId/$messageId/results")({
  component: RouteComponent,
});

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define consistent colors
const COLORS = {
  DAN: "bg-green-200",
  KSENDJI: "bg-yellow-200",
  ILYA: "bg-pink-200",
};

// Sample data for users and their selected items
const currentUser = {
  id: 1,
  name: "Your share",
  color: COLORS.DAN,
  total: 15,
  items: [
    { id: 1, name: "Pizza", price: 6 },
    { id: 2, name: "Cappicino", price: 2 },
    { id: 3, name: "Salad", price: 4 },
    { id: 4, name: "Carrot cake", price: 3 },
  ],
};

const otherUsers = [
  {
    id: 2,
    name: "Ksendji",
    color: COLORS.KSENDJI,
    total: 13,
    items: [
      { id: 1, name: "Pizza", price: 6 },
      { id: 3, name: "Salad", price: 4 },
      // Additional items could be added here
    ],
  },
  {
    id: 3,
    name: "Ilya",
    color: COLORS.ILYA,
    total: 6,
    items: [
      { id: 1, name: "Pizza", price: 6 },
      { id: 4, name: "Carrot cake", price: 3 },
    ],
  },
];

export default function RouteComponent() {
  const navigate = Route.useNavigate();

  const handleRevote = () => {
    navigate({ to: ".." });
  };

  const handleItemClick = (itemId: number) => {
    navigate({ to: `../item/${itemId}` });
  };

  const handleComplete = () => {
    navigate({ to: "../summary" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 max-w-md mx-auto w-full flex flex-col">
        <div className="border rounded-md overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-2xl font-bold title-transition">Split</h1>
            <button
              onClick={handleRevote}
              className="text-gray-400 hover:text-gray-600"
            >
              Re-vote
            </button>
          </div>

          {/* Add spacing between header and content */}
          <div className="h-3 bg-gray-50"></div>

          <div className="flex-1 overflow-auto">
            {/* Current User Section */}
            <div className="border-b">
              {/* User header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar
                    className={`w-6 h-6 ${currentUser.color} avatar-transition`}
                  >
                    <AvatarFallback className="text-xs"></AvatarFallback>
                  </Avatar>
                  <span className="text-lg font-medium">
                    {currentUser.name}
                  </span>
                </div>
                <span className="font-bold">${currentUser.total}</span>
              </div>

              {/* User items */}
              {currentUser.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-base">{item.name}</span>
                  </div>
                  <span className="text-gray-500">${item.price}</span>
                </div>
              ))}
            </div>

            {/* Spacer */}
            <div className="h-6 bg-gray-50"></div>

            {/* Other Users Section */}
            <Accordion type="multiple" className="w-full">
              {otherUsers.map((user) => (
                <AccordionItem
                  key={user.id}
                  value={`user-${user.id}`}
                  className="border-b"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className={`w-6 h-6 ${user.color} avatar-transition`}
                        >
                          <AvatarFallback className="text-xs"></AvatarFallback>
                        </Avatar>
                        <span className="text-lg font-medium">{user.name}</span>
                      </div>
                      <span className="font-bold">${user.total}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {user.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-4 border-t last:border-b-0 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleItemClick(item.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-base">{item.name}</span>
                        </div>
                        <span className="text-gray-500">${item.price}</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Complete Button */}
          <div className="p-4 mt-auto">
            <Button
              onClick={handleComplete}
              className="w-full py-6 text-lg bg-blue-400 hover:bg-blue-500 button-transition"
            >
              Complete
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
