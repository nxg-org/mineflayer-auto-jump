import EventEmitter from "events";
import type { Bot } from "mineflayer";
import { BaseSimulator, EntityPhysics, EPhysicsCtx } from "@nxg-org/mineflayer-physics-util";
import { ControlStateHandler } from "@nxg-org/mineflayer-physics-util";

export interface JumpCheckerOpts {
  edgeToLiquidOnly: boolean;
  minimizeFallDmg: boolean;
}

export const defaultHandlerKeys: JumpCheckerOpts = {
  edgeToLiquidOnly: false,
  minimizeFallDmg: false,
};

export class JumpChecker extends BaseSimulator implements JumpCheckerOpts {
  public edgeToLiquidOnly: boolean = false;
  public minimizeFallDmg: boolean = false;

  public constructor(private bot: Bot) {
    super(new EntityPhysics((bot as any).registry));
  }

  public shouldJump() {
    if (
      this.bot.getControlState("back") ||
      this.bot.getControlState("forward") ||
      this.bot.getControlState("left") ||
      this.bot.getControlState("right")
    ) {
      if (this.dontJumpSinceCantClear()) {
        return false;
      }
      return (
        this.shouldJumpFromCollision() ||
        (this.edgeToLiquidOnly ? this.shouldJumpForWater() : this.shouldJumpSinceBlockEdge())
      );
    }
    return false;
  }

  /**
   * This can be optimized by calculating the max height of player (1.25) and the resulting jump boost.
   * @returns
   */
  protected dontJumpSinceCantClear() {
    const ectx = EPhysicsCtx.FROM_ENTITY(this.ctx, this.bot.entity);
    ectx.state.controlState = ControlStateHandler.COPY_BOT(this.bot as any);
    ectx.state.controlState.set("jump", true);

    const nextTick = this.simulateUntil(
      (state, ticks) => {
        let flag = false;
        if (this.minimizeFallDmg) flag = state.velocity.y < -0.6;
        return flag || (ticks > 1 && state.onGround);
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999 // unneeded since we'll always be reaching our goal relatively easily.
    );

    let flag = false;
    if (this.minimizeFallDmg) flag = nextTick.velocity.y < -0.6;
    return flag || (nextTick.isCollidedHorizontally && Math.floor(nextTick.position.y) === Math.floor(this.bot.entity.position.y));
  }

  /**
   * TODO: Handle multiple blocks (lazy, do it later on request)
   *
   * Code should jump from collision with a block in front of it.
   * @returns whether bot collides within maxAge ticks or not.
   */
  protected shouldJumpFromCollision(): boolean {
    const ectx = EPhysicsCtx.FROM_ENTITY(this.ctx, this.bot.entity);
    ectx.state.controlState = this.bot.controlState as any;

    // console.log(ectx.state.controlState);

    let minAge = 7;

    // handles vanilla and up to ~5 for both.
    // it's stupid tho, so feel free to change it.
    if (ectx.state.speed > 1 || ectx.state.jumpBoost > 1) {
      let base = 5;
      if (ectx.state.jumpBoost > 1) {
        base -= Math.ceil(ectx.state.jumpBoost / 2);
      }
      minAge = base + Math.ceil(ectx.state.speed / 5);
    }

    const nextTick = this.simulateUntil(
      (state, ticks) => {
        return state.isCollidedHorizontally;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      minAge
    );

    return nextTick.age < minAge;
  }

  /**
   * Note: this is purposefully cheap.
   * @returns Should we jump or not, depending on leaving edge of block to fall.
   */
  protected shouldJumpSinceBlockEdge(): boolean {
    const nextTick = this.predictForward(this.bot.entity, this.bot.world, 1, this.bot.controlState as any);
    return !nextTick.onGround;
  }

  /**
   * Robust, expensive check for landable water.
   *
   * Note: I do NOT implement auto-bobbing. If we do that, change the first two return statements to true,
   * and uncomment that line.
   * @returns
   */
  protected shouldJumpForWater(): boolean {
    if ((this.bot.entity as any).isInWater) return false;
    // if (!isNaN(Number(this.bot.blockAt(this.bot.entity.position.offset(0, -0.251, 0))?.getProperties()["level"]))) return false;
    if (!this.shouldJumpSinceBlockEdge()) return false;

    const ectx = EPhysicsCtx.FROM_ENTITY(this.ctx, this.bot.entity);
    ectx.state.controlState = ControlStateHandler.COPY_BOT(this.bot as any);
    ectx.state.controlState.set("jump", true);

    const nextTick = this.simulateUntil(
      (state, ticks) => {
        return state.isInLava || state.isInWater || (ticks > 0 && state.isCollidedVertically);
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999 // unneeded since we'll always be reaching our goal relatively easily.
    );

    return !(nextTick.isCollidedVertically && !nextTick.isInWater);
  }
}
