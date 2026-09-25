export type ScValType =
  | "bool"
  | "u32"
  | "i32"
  | "u64"
  | "i64"
  | "u128"
  | "i128"
  | "u256"
  | "i256"
  | "symbol"
  | "string"
  | "address"
  | "bytes";

/**
 * Valid scalar input types for Soroban contract arguments.
 * Use this instead of `any[]` when passing arguments to contract invocations.
 */
export type ScValInput = string | number | bigint | boolean | ContractArg;

export interface ContractArg {
  value: string | number | bigint | boolean | Uint8Array;
  type?: ScValType;
}

export interface ContractInvocation {
  contractId: string;
  method: string;
  args?: ScValInput[];
}

export interface ContractSimulationResult {
  successful: boolean;
  returnValue?: any;
  minResourceFee?: string;
  cpuInstructions?: number;
  memoryBytes?: number;
  error?: string;
}
