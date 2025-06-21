import { createFileRoute } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import CircularProgress from "@/components/circular-progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trpc } from "@/router";
import { getColorFromId } from "@/lib/colors";
import { useAuth } from "@/lib/auth/use-auth";
import { getCurrencySymbol } from "@/lib/currency";

export const Route = createFileRoute("/app/bill/$billId/results")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { billId } = params;
    return trpc.bill.results.query({ billId: Number(billId) });
  },
});

export default function RouteComponent() {
  const navigate = Route.useNavigate();
  const { userSelections, unvotedItems, bill } = Route.useLoaderData();
  const currencySymbol = getCurrencySymbol(bill.currency);

  const handleRevote = () => {
    navigate({ to: ".." });
  };

  const handleItemClick = (itemId: number) => {
    navigate({ to: `../item/${itemId}` });
  };

  const handleComplete = () => {
    navigate({ to: "../summary" });
  };

  const { user } = useAuth();

  const currentUserWithSelections = {
    id: user.id,
    name: user.name,
    photoUrl: user.photoUrl,
    ...userSelections[user.id],
  };

  return (
    <>
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
                className={`w-6 h-6 avatar-transition`}
                style={{
                  backgroundColor: getColorFromId(
                    Number(currentUserWithSelections.id),
                  ),
                }}
              >
                <AvatarImage
                  src={currentUserWithSelections.photoUrl ?? undefined}
                />
                <AvatarFallback className="text-xs"></AvatarFallback>
              </Avatar>
              <span className="text-lg font-medium">
                {currentUserWithSelections.name}
              </span>
            </div>
            <span className="font-bold">
              {currencySymbol}
              {currentUserWithSelections.total}
            </span>
          </div>

          {/* User items */}
          {currentUserWithSelections.itemsWithProportion.map((item) => {
            const totalItemCost =
              item.item.priceTotal ??
              (item.item.pricePerUnit ?? 0) * (item.item.quantity ?? 1);
            const percentage =
              totalItemCost > 0
                ? (item.proportionalPrice / totalItemCost) * 100
                : 0;
            return (
              <div
                key={item.item.id}
                className="flex items-center justify-between py-2 px-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                onClick={() => handleItemClick(item.item.id)}
              >
                <div className="flex items-center gap-2">
                  <CircularProgress
                    percentage={percentage}
                    size={20}
                    strokeWidth={3}
                  />
                  <span className="text-base">{item.item.nameEnglish}</span>
                </div>
                <span className="text-gray-500">
                  {currencySymbol}
                  {item.proportionalPrice}
                </span>
              </div>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="h-6 bg-gray-50"></div>

        {/* Other Users Section */}
        <Accordion type="multiple" className="w-full">
          {Object.entries(userSelections)
            .filter(([userId]) => userId !== user.id.toString())
            .map(([userId, user]) => (
              <AccordionItem
                key={userId}
                value={`user-${userId}`}
                className="border-b"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={`w-6 h-6 avatar-transition`}
                        style={{
                          backgroundColor: getColorFromId(Number(userId)),
                        }}
                      >
                        <AvatarImage src={user.user?.photoUrl ?? undefined} />
                      </Avatar>
                      <span className="text-lg font-medium">
                        {user.user?.name ?? userId}
                      </span>
                    </div>
                    <span className="font-bold">
                      {currencySymbol}
                      {user.total}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {user.itemsWithProportion.map((item, index) => {
                    const totalItemCost =
                      item.item.priceTotal ??
                      (item.item.pricePerUnit ?? 0) * (item.item.quantity ?? 1);
                    const percentage =
                      totalItemCost > 0
                        ? (item.proportionalPrice / totalItemCost) * 100
                        : 0;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-4 border-t last:border-b-0 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleItemClick(item.item.id)}
                      >
                        <div className="flex items-center gap-2">
                          <CircularProgress
                            percentage={percentage}
                            size={20}
                            strokeWidth={3}
                          />
                          <span className="text-base">
                            {item.item.nameEnglish}
                          </span>
                        </div>
                        <span className="text-gray-500">
                          {currencySymbol}
                          {item.proportionalPrice}
                        </span>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}

          <AccordionItem value={`unvoted`} className="border-b">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Avatar className={`w-6 h-6 avatar-transition`}>
                    <AvatarFallback className="text-xs"></AvatarFallback>
                  </Avatar>
                  <span className="text-lg font-medium">Unvoted</span>
                </div>
                <span className="font-bold">
                  {currencySymbol}
                  {unvotedItems.reduce(
                    (acc, item) =>
                      acc +
                      (item.priceTotal ??
                        (item.pricePerUnit ?? 0) * (item.quantity ?? 0)),
                    0,
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {unvotedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-4 border-t last:border-b-0 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="flex items-center gap-2">
                    <CircularProgress
                      percentage={0}
                      size={20}
                      strokeWidth={3}
                    />
                    <span className="text-base">{item.nameEnglish}</span>
                  </div>
                  <span className="text-gray-500">
                    {currencySymbol}
                    {item.priceTotal}
                  </span>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
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
    </>
  );
}
