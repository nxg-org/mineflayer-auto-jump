import { EventEmitter } from "events";
import type { StrictEventEmitter } from "strict-event-emitter-types";

export interface JumpCheckerOpts {
  jumpOnAllEdges: boolean;
  jumpIntoWater: boolean;
  jumpDownDescending: number;
  minimizeFallDmg: boolean;
  debug: boolean;
}

export const DefaultHandlerKeys: JumpCheckerOpts = {
  jumpOnAllEdges: false,
  jumpIntoWater: false,
  jumpDownDescending: 0,
  minimizeFallDmg: false,
  debug: false
};

export interface AutoJumperOpts {
  enabled: boolean;
}

export const DefaultKeys: AutoJumperOpts = {
  enabled: false,
};

interface AutoJumperEvents {
  shouldJump: () => void;
}

export type AutoJumperEmitter = StrictEventEmitter<EventEmitter, AutoJumperEvents>;
