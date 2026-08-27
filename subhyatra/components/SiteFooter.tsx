import { BusFront } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-night text-mist">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-2">
          <BusFront className="w-4 h-4 text-marigold" />
          SubhYatra — bus tickets across Nepal
        </span>
        <span>© {new Date().getFullYear()} SubhYatra. Safe travels, every route.</span>
      </div>
    </footer>
  );
}
