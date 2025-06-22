import { createFileRoute, redirect } from "@tanstack/react-router";

import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/app/bill/$billId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { billId } = params;
    const [billRes, userRes] = await Promise.all([
      apiClient.bill[":billId"].$get({ param: { billId } }),
      apiClient.user.$get(),
    ]);

    if (!billRes.ok) {
      throw new Error("Failed to fetch bill");
    }

    if (!userRes.ok) {
      throw new Error("Failed to fetch user");
    }

    const billData = await billRes.json();
    const user = await userRes.json();

    const hasVoted = billData.votes.some(
      (vote: { user: { id: number } }) => vote.user.id === user.id,
    );

    if (hasVoted) {
      throw redirect({ to: "/app/bill/$billId/items", params: { billId } });
    }

    throw redirect({ to: "/app/bill/$billId/vote", params: { billId } });
  },
});

function RouteComponent() {
  return null;
}
