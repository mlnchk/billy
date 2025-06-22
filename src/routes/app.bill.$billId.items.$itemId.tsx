import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutFooter } from "@/components/layout-footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getColorFromId } from "@/lib/colors";
import { useMutation } from "@tanstack/react-query";
import { getCurrencySymbol } from "@/lib/currency";

export const Route = createFileRoute("/app/bill/$billId/items/$itemId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    console.log("params", params);
    const { billId, itemId } = params;

    const itemResponse = await apiClient.bill[":billId"].items[":itemId"].$get({
      param: { billId, itemId },
    });

    if (!itemResponse.ok) {
      throw new Error("Failed to fetch bill item");
    }

    const itemData = await itemResponse.json();

    const billResponse = await apiClient.bill[":billId"].$get({
      param: { billId },
    });

    let participants: (typeof itemData.userVotes)[number]["user"][] = [];
    if (billResponse.ok) {
      const billData = await billResponse.json();
      const userMap = new Map(
        billData.votes.map((v: any) => [v.user.id, v.user]),
      );
      participants = Array.from(userMap.values());
    }

    return { ...itemData, participants };
  },
});

export default function RouteComponent() {
  const navigate = Route.useNavigate();
  const { billId, itemId } = Route.useParams();
  const { billItem, userVotes, bill, participants } = Route.useLoaderData();
  const currencySymbol = getCurrencySymbol(bill.currency);
  const [voters, setVoters] = useState(userVotes);
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

  const addParticipant = (userId: number) => {
    const user = participants.find((p) => p.id === userId);
    if (!user) return;
    setVoters((prev) => [...prev, { userId: user.id, share: 1, user }]);
  };

  const availableParticipants = participants.filter(
    (p) => !voters.some((v) => v.user.id === p.id),
  );

  const handleSave = async () => {
    // TODO: save the data here
    await updateVotes();
    navigate({ to: ".." });
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: ".." })}
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

        {availableParticipants.length > 0 && (
          <div className="px-4 mt-4">
            <Select onValueChange={(v) => addParticipant(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add participant" />
              </SelectTrigger>
              <SelectContent>
                {availableParticipants.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name ?? user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <LayoutFooter className="p-2">
        <Button
          onClick={handleSave}
          className="w-full py-6 text-lg bg-blue-400 hover:bg-blue-500 button-transition"
        >
          Save
        </Button>
      </LayoutFooter>
    </>
  );
}
