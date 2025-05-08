import { EventEmitter } from "events";
import type { StrictEventEmitter } from "strict-event-emitter-types";

export interface JumpCheckerOpts {
  strictBlockCollision: boolean;
  jumpOnAllEdges: boolean;
  jumpToClearSmallDip: boolean;
  jumpIntoWater: boolean;
  maxBlockOffset: number;
  minimizeFallDmg: boolean;
  debug: boolean;
}

export const DefaultHandlerKeys: JumpCheckerOpts = {
  strictBlockCollision: true,
  jumpOnAllEdges: false,
  jumpToClearSmallDip: false,
  jumpIntoWater: false,
  maxBlockOffset: 0,
  minimizeFallDmg: false,
  debug: false
};

export interface AutoJumperOpts {
  enabled: boolean;
  cancelOnShift: boolean;
}

export const DefaultKeys: AutoJumperOpts = {
  enabled: false,
  cancelOnShift: false
};

interface AutoJumperEvents {
  shouldJump: () => void;
  stopJump: () => void;
}

export type AutoJumperEmitter = StrictEventEmitter<EventEmitter, AutoJumperEvents>;
