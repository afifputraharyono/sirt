import { Plus } from "lucide-react";

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      {children}
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </button>
  );
}
