import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Auth error</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}
