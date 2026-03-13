import { useCallback } from "react";
export function useClipboard() {
    const copy = useCallback(async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        }
        catch {
            return false;
        }
    }, []);
    return { copy };
}
//# sourceMappingURL=useClipboard.js.map