import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/router";
import { createContext, PropsWithChildren } from "react";

export const AuthContext = createContext<{
  user: { id: number; name: string | null; photoUrl: string | null } | null;
}>({
  user: null,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const {
    data: user,
    isLoading,
    isSuccess,
  } = useQuery(trpc.user.me.queryOptions());

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isSuccess) {
    return <div>Auth error</div>;
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}
