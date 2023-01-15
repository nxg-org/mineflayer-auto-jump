import { EventEmitter } from "events";
import type { StrictEventEmitter } from "strict-event-emitter-types";

export interface JumpCheckerOpts {
  jumpOnEdge: boolean;
  jumpIntoWater: boolean;
  minimizeFallDmg: boolean;
}

export const DefaultHandlerKeys: JumpCheckerOpts = {
  jumpOnEdge: false,
  jumpIntoWater: false,
  minimizeFallDmg: false,
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
