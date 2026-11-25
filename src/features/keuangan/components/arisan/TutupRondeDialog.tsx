import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TutupRondeDialog({
  open, onOpenChange, nomor, tanggal, onTanggalChange, onConfirm, pending, bisaDitutup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomor: number | undefined;
  tanggal: string;
  onTanggalChange: (value: string) => void;
  onConfirm: () => void;
  pending: boolean;
  bisaDitutup: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tutup ronde {nomor}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ronde hanya bisa ditutup setelah semua anggota menang dan seluruh pot
            disalurkan. Putaran pada ronde ini tidak bisa diubah lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5 py-2">
          <Label className="text-[12.5px] font-bold">Tanggal tutup</Label>
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
            disabled={pending || !bisaDitutup}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Tutup ronde
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
