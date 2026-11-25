import { Label } from "@/components/ui/label";

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] font-bold">{label}</Label>
      {children}
    </div>
  );
}

export function PrimaryButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan"}
    </button>
  );
}
