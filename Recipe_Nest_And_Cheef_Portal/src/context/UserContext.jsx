import { useMemo, useState } from "react";
import { UserContext } from "./UserContextDefinition";

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  });

  const setUser = (user) => {
    if (!user) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("chefId");
      setCurrentUser(null);
      return;
    }

    const normalized =
      typeof user === "object"
        ? { ...user, fullName: user.fullName || user.name || "", name: user.name || user.fullName || "" }
        : { id: String(user) };
    localStorage.setItem("currentUser", JSON.stringify(normalized));
    if (normalized.id) {
      localStorage.setItem("chefId", String(normalized.id));
    }
    setCurrentUser(normalized);
  };

  const value = useMemo(
    () => ({
      user: currentUser,
      userId: currentUser?.id || null,
      userName: currentUser?.fullName || currentUser?.name || "",
      setUser,
      logout: () => setUser(null),
    }),
    [currentUser]
  );

   return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
