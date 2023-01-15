import { EventEmitter } from "events";
import type { StrictEventEmitter } from "strict-event-emitter-types";

export interface JumpCheckerOpts {
  edgeToLiquidOnly: boolean;
  minimizeFallDmg: boolean;
}

export const DefaultHandlerKeys: JumpCheckerOpts = {
  edgeToLiquidOnly: false,
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
