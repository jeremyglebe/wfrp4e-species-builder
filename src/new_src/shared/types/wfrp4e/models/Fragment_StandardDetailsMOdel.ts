export interface Fragment_StandardDetailsModel {
  readonly age: {
    readonly value?: number;
  };
  readonly biography?: string;
  readonly distinguishingmark: {
    readonly value?: string;
  };
  readonly eyecolour: {
    readonly value?: string;
  };
  readonly gender: {
    readonly value?: string;
  };
  readonly gmnotes: {
    readonly value?: string;
  };
  readonly god: {
    readonly value?: string;
  };
  readonly haircolour: {
    readonly value?: string;
  };
  readonly height: {
    readonly value?: number;
  };
  readonly hitLocationTable: {
    readonly value?: string;
  };
  readonly mainHand: string;
  readonly move: {
    readonly value: number;
    readonly walk: number;
    readonly run: number;
  };
  readonly size: {
    readonly value?: string;
  };
  readonly species: {
    readonly value?: string;
    readonly subspecies?: string;
  };
  readonly status: {
    readonly value?: string;
    readonly standing?: string;
    readonly tier?: number;
    readonly modifier?: number;
  };
  readonly weight: {
    readonly value?: number;
  };
}
