import { useContext } from "react";
import { AuthContext } from "./auth-provider";

export function useAuth() {
  const { user } = useContext(AuthContext);

  if (!user) {
    throw new Error("User not found");
  }

  return { user };
}
