import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const { user, updateUserProfile } = useAuth();
  const dateSystem = user?.dateSystem === "nepali" ? "nepali" : "gregorian";

  const setDateSystem = (nextDateSystem) => updateUserProfile({
    dateSystem: nextDateSystem === "nepali" ? "nepali" : "gregorian"
  });

  return (
    <CalendarContext.Provider value={{ dateSystem, setDateSystem }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within CalendarProvider");
  return context;
}
