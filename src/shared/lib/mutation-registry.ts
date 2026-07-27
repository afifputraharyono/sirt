import {
  createKas,
  updateKas,
  createJimpitan,
  updateJimpitan,
  upsertJimpitanBatch,
  createPengeluaran,
  updatePengeluaran,
  type CreateKasInput,
  type CreateJimpitanInput,
  type UpdateJimpitanInput,
  type CreatePengeluaranInput,
} from "@/features/keuangan/services";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mutationRegistry: Record<string, (vars: any) => Promise<any>> = {
  "kas:create": (vars: CreateKasInput) => createKas(vars),
  "kas:update": ({ id, ...input }: { id: string } & Partial<CreateKasInput>) =>
    updateKas(id, input),
  "jimpitan:create": (vars: CreateJimpitanInput) => createJimpitan(vars),
  "jimpitan:update": ({
    id,
    ...input
  }: { id: string } & UpdateJimpitanInput) => updateJimpitan(id, input),
  "jimpitan:upsert-batch": (vars: CreateJimpitanInput[]) =>
    upsertJimpitanBatch(vars),
  "pengeluaran:create": (vars: CreatePengeluaranInput) =>
    createPengeluaran(vars),
  "pengeluaran:update": ({
    id,
    ...input
  }: { id: string } & Partial<CreatePengeluaranInput>) =>
    updatePengeluaran(id, input),
};
