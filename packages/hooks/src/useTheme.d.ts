export type Theme = "light" | "dark" | "system";
export interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}
export declare const ThemeContext: import("react").Context<ThemeContextValue>;
export declare function useTheme(): ThemeContextValue;
//# sourceMappingURL=useTheme.d.ts.map