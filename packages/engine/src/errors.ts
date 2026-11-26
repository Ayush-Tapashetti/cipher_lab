/** Named domain errors. The engine throws these and nothing else for expected failures. */
export type DomainErrorCode =
  | 'InvalidModulus'
  | 'NotAnInteger'
  | 'NoModularInverse'
  | 'InvalidShift'
  | 'NotCoprimeWith26'
  | 'NotAPermutation'
  | 'InvalidKey'
  | 'EmptyText'
  | 'IllegalTransition'
  | 'NotAUnit'
  | 'NoSolution'
  | 'IdenticalPlaintexts'
  | 'InvalidRedundancy'
  | 'CorpusTooShort'
  | 'InvalidParameter';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly detail: string;

  constructor(code: DomainErrorCode, detail = '') {
    super(detail === '' ? code : `${code}: ${detail}`);
    this.name = 'DomainError';
    this.code = code;
    this.detail = detail;
  }
}
