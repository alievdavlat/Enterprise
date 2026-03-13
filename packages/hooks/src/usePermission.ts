export function usePermission() {
  return { can: (_action: string, _subject?: string) => true };
}
