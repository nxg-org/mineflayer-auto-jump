import { BaseSimulator, ControlStateHandler, EntityPhysics, EPhysicsCtx } from "@nxg-org/mineflayer-physics-util";
import type { Bot } from "mineflayer";

import { JumpCheckerOpts } from "./utils";

function tp({ x, y, z }: { x: number; y: number; z: number }, ...args: any[]) {
  console.log(`${x} ${y} ${z}`, ...args);
}

export class JumpChecker extends BaseSimulator implements JumpCheckerOpts {
  public jumpOnEdge: boolean = false;
  public jumpIntoWater: boolean = false;
  public minimizeFallDmg: boolean = false;

  public constructor(private bot: Bot) {
    super(new EntityPhysics(bot.registry));
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
        this.shouldJumpSinceNextBlockEmptyAndAvailableBlock() ||
        (this.jumpOnEdge ? this.shouldJumpSinceBlockEdge() : this.jumpIntoWater ? this.shouldJumpIntoWater() : false)
      );
    }
    return false;
  }

  /**
   * This can be optimized by calculating the max height of player (1.25) and the resulting jump boost.
   * @returns
   */
  protected dontJumpSinceCantClear() {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx.state.controlState.set("jump", true);

    let simState = this.simulateUntil(
      (state, ticks) => {
        let flag = false;
        if (this.minimizeFallDmg) flag = state.velocity.y < -0.6;
        return flag || (ticks > 0 && state.isCollidedVertically);
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999 // unneeded since we'll always be reaching our goal relatively easily.
    );

    // tp(this.bot.entity.position, "original ");
    // tp(simState.position, "first sim", simState.isCollidedVertically, simState.onGround)
    let flag = false;
    // if we collide with a block above us, we still don't know if we will make it or not.
    // So continue simulating.
    if (simState.isCollidedVertically && !simState.onGround) {
      simState = this.simulateUntil(
        (state, ticks) => {
          let flag = false;
          if (this.minimizeFallDmg) flag = state.velocity.y < -0.6;
          return flag || (ticks > 0 && (state.onGround || simState.isCollidedHorizontally));
        },
        (state) => {},
        (state, ticks) => {},
        ectx,
        this.bot.world,
        999 // unneeded since we'll always be reaching our goal relatively easily.
      );
      // tp(simState.position, "second sim", simState.isCollidedHorizontally, simState.isCollidedVertically)
      return (
        simState.isCollidedHorizontally || Math.floor(simState.position.y) <= Math.floor(this.bot.entity.position.y)
      );
    }

    if (this.minimizeFallDmg) flag = flag || simState.velocity.y < -0.6;
    return (
      flag ||
      (simState.isCollidedHorizontally && Math.floor(simState.position.y) <= Math.floor(this.bot.entity.position.y))
    );
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

  protected shouldJumpSinceNextBlockEmptyAndAvailableBlock() {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx.state.controlState.set("jump", true);

    const jumpState = this.simulateUntil(
      (state, ticks) => {
        return ticks > 0 && state.onGround;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      30 // end of jump.
    );

    if (jumpState.position.y < this.bot.entity.position.y) return false;

    const ectx1 = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);

    const runState = this.simulateUntil(
      (state, ticks) => {
        return state.position.y < this.bot.entity.position.y;
      },
      (state) => {},
      (state, ticks) => {},
      ectx1,
      this.bot.world,
      jumpState.age // end of jump.
    );

    return jumpState.position.y >= this.bot.entity.position.y && runState.position.y < this.bot.entity.position.y;
  }

  /**
   * Robust, expensive check for landable water.
   *
   * Note: I do NOT implement auto-bobbing. If we do that, change the first two return statements to true,
   * and uncomment that line.
   * @returns
   */
  protected shouldJumpIntoWater(): boolean {
    if ((this.bot.entity as any).isInWater) return false;
    // if (!isNaN(Number(this.bot.blockAt(this.bot.entity.position.offset(0, -0.251, 0))?.getProperties()["level"]))) return false;
    if (!this.shouldJumpSinceBlockEdge()) return false;

    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
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
