import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
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
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await apiClient.user.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      return response.json();
    },
  });

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
