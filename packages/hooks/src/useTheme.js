import { useContext, createContext } from "react";
export const ThemeContext = createContext({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => { },
});
export function useTheme() {
    return useContext(ThemeContext);
}
//# sourceMappingURL=useTheme.js.map