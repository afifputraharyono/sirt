import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ArisanRekap } from "@/shared/types/database";

export function SalurkanDialog({
  target, tanggal, onTanggalChange, onClose, onConfirm, pending,
}: {
  target: ArisanRekap | null;
  tanggal: string;
  onTanggalChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Salurkan pot arisan?</AlertDialogTitle>
          <AlertDialogDescription>
            Pengeluaran dana Arisan akan dibuat sebesar pot putaran ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5 py-2">
          <Label className="text-[12.5px] font-bold">Tanggal salur</Label>
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => onTanggalChange(e.target.value)}
            className="rounded-[11px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Salurkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
