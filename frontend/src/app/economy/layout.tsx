import AppLayout from "@/components/AppLayout";

/**
 * Economy section layout.
 * Wraps all /economy/* routes in AppLayout (shared navbar + mode-aware sidebar).
 * Adds EconPulse-specific CSS variable overrides scoped to this subtree.
 */
export default function EconomyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {/* Scoped EconPulse CSS variables — override inside this subtree only */}
      <style>{`
        .economy-scope {
          --card: 15 23 42;           /* slate-900 */
          --card-foreground: 226 232 240;
          --muted: 30 41 59;
          --muted-foreground: 148 163 184;
          --border: 51 65 85;
          --background: 2 6 23;
          --foreground: 248 250 252;
          --primary: 59 130 246;
          --primary-foreground: 255 255 255;
        }
      `}</style>
      <div className="economy-scope">{children}</div>
    </AppLayout>
  );
}
