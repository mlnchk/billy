import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  // TODO: we can do redirect on route level
  // beforeLoad: async (ctx) => {
  // const { tgWebAppStartParam } = parseLaunchParamsQuery(
  //   ctx.location.searchStr,
  // );
  // if (tgWebAppStartParam?.startsWith("bill_")) {
  //   const billId = tgWebAppStartParam.replace("bill_", "");
  //   throw redirect({ to: "/app/bill/$billId", params: { billId } });
  // }
  // },
});
function RouteComponent() {
  const { tgWebAppStartParam } = useLaunchParams();

  // FIXME: move parsing logic to an util
  if (tgWebAppStartParam?.startsWith("bill_")) {
    const billId = tgWebAppStartParam.replace("bill_", "");
    return <Navigate to="/app/bill/$billId" params={{ billId }} />;
  }

  return <div>Hello "/" {tgWebAppStartParam}!</div>;
}
