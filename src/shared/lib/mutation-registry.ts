import {
  createKas,
  updateKas,
  upsertKasBatch,
  createJimpitan,
  updateJimpitan,
  upsertJimpitanBatch,
  createPengeluaran,
  updatePengeluaran,
  simpanArisanPutaran,
  salurkanArisanPutaran,
  type CreateKasInput,
  type CreateJimpitanInput,
  type UpdateJimpitanInput,
  type CreatePengeluaranInput,
  type SimpanArisanPutaranInput,
  type JimpitanWithRumah,
  type PengeluaranWithGrup,
} from "@/features/keuangan/services";
import type {
  ArisanPutaran,
  JimpitanHarian,
  KasBulanan,
} from "@/shared/types/database";

export interface MutationRegistry {
  "kas:create": (vars: CreateKasInput) => Promise<KasBulanan>;
  "kas:upsert-batch": (vars: CreateKasInput[]) => Promise<KasBulanan[]>;
  "kas:update": (vars: {
    id: string;
  } & Partial<CreateKasInput>) => Promise<KasBulanan>;
  "jimpitan:create": (vars: CreateJimpitanInput) => Promise<JimpitanHarian>;
  "jimpitan:update": (vars: {
    id: string;
  } & UpdateJimpitanInput) => Promise<JimpitanHarian>;
  "jimpitan:upsert-batch": (
    vars: CreateJimpitanInput[]
  ) => Promise<JimpitanWithRumah[]>;
  "pengeluaran:create": (
    vars: CreatePengeluaranInput
  ) => Promise<PengeluaranWithGrup>;
  "pengeluaran:update": (vars: {
    id: string;
  } & Partial<CreatePengeluaranInput>) => Promise<PengeluaranWithGrup>;
  "arisan:simpan": (vars: SimpanArisanPutaranInput) => Promise<ArisanPutaran>;
  "arisan:salurkan": (vars: {
    id: string;
    tanggal: string;
  }) => Promise<ArisanPutaran>;
}

export type MutationKey = keyof MutationRegistry;

export type MutationInput<K extends MutationKey> = Parameters<
  MutationRegistry[K]
>[0];

export const mutationRegistry: MutationRegistry = {
  "kas:create": (vars) => createKas(vars),
  "kas:upsert-batch": (vars) => upsertKasBatch(vars),
  "kas:update": ({ id, ...input }) => updateKas(id, input),
  "jimpitan:create": (vars) => createJimpitan(vars),
  "jimpitan:update": ({ id, ...input }) => updateJimpitan(id, input),
  "jimpitan:upsert-batch": (vars) => upsertJimpitanBatch(vars),
  "pengeluaran:create": (vars) => createPengeluaran(vars),
  "pengeluaran:update": ({ id, ...input }) => updatePengeluaran(id, input),
  "arisan:simpan": (vars) => simpanArisanPutaran(vars),
  "arisan:salurkan": ({ id, tanggal }) => salurkanArisanPutaran(id, tanggal),
};

export function runMutation<K extends MutationKey>(
  key: K,
  variables: MutationInput<K>,
): Promise<unknown> {
  // TS tidak bisa memanggil union of functions hasil indexed access generik.
  const handler = mutationRegistry[key] as (
    vars: MutationInput<K>
  ) => Promise<unknown>;
  return handler(variables);
}
