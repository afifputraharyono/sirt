import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SimpanArisanPutaranInput } from "@/features/keuangan/services";
import { formatRupiah } from "@/shared/utils/format";

export function TalanganDialog({
  payload, formPot, selisih, onClose, onConfirm, pending,
}: {
  payload: SimpanArisanPutaranInput | null;
  formPot: number;
  selisih: number;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <AlertDialog open={!!payload} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nominal melebihi pot?</AlertDialogTitle>
          <AlertDialogDescription>
            Nominal {formatRupiah(payload?.nominal ?? 0)} melebihi pot terkumpul{" "}
            {formatRupiah(formPot)}. Selisih {formatRupiah(selisih)} akan
            dibayar dari saldo kas sebagai talangan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-amber-500 text-amber-950 hover:bg-amber-600"
          >
            Simpan dengan talangan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
