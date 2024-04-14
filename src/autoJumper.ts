import { BaseSimulator, EntityPhysics, EPhysicsCtx } from "@nxg-org/mineflayer-physics-util";
import type { Bot } from "mineflayer";

import { JumpCheckerOpts } from "./utils";

function tp({ x, y, z }: { x: number; y: number; z: number }, ...args: any[]) {
  console.log(`${x} ${y} ${z}`, ...args);
}

export class JumpChecker extends BaseSimulator implements JumpCheckerOpts {
  public jumpOnAllEdges: boolean = false;
  public jumpIntoWater: boolean = false;
  public maxBlockOffset: number = 0;
  public minimizeFallDmg: boolean = false;
  public debug: boolean = false;

  public constructor(private bot: Bot) {
    super(new EntityPhysics(bot.registry));
  }

  public shouldJump() {
    if (
      this.bot.getControlState("back") ||
      this.bot.getControlState("forward") ||
      this.bot.getControlState("left") ||
      this.bot.getControlState("right") // && this.bot.entity.onGround
    ) {
      if (this.debug) {
    
          console.log(
            "bad:",
            this.dontJumpSinceCantClear(),
            "good:",
            this.shouldJumpFromCollision(),
            this.shouldJumpToAvoidDanger(),
            !this.jumpOnAllEdges && this.jumpIntoWater ? this.shouldJumpIntoWater() : false,
            this.shouldJumpSinceNextBlockEmptyAndAvailableBlock(),
            this.jumpOnAllEdges ? this.shouldJumpSinceBlockEdge() : false
          );
          tp(this.bot.entity.position, "pos");
    

      }
      if (this.dontJumpSinceCantClear()) {
        return false;
      }

      return (
        this.shouldJumpFromCollision() ||
        this.shouldJumpToAvoidDanger() ||
        (!this.jumpOnAllEdges && this.jumpIntoWater ? this.shouldJumpIntoWater() : false) ||
        this.shouldJumpSinceNextBlockEmptyAndAvailableBlock() ||
        (this.jumpOnAllEdges ? this.shouldJumpSinceBlockEdge() : false)
      );
    }
    return false;
  }

  public canJump() {
    if (this.debug) {
      console.log(
        "bad:",
        this.dontJumpSinceCantClear(),
        "good:",
        this.shouldJumpFromCollision(),
        this.shouldJumpToAvoidDanger(),
        !this.jumpOnAllEdges && this.jumpIntoWater ? this.shouldJumpIntoWater() : false,
        this.shouldJumpSinceNextBlockEmptyAndAvailableBlock(),
        this.jumpOnAllEdges ? this.shouldJumpSinceBlockEdge() : false
      );
      tp(this.bot.entity.position, "pos");
    }
    return !this.dontJumpSinceCantClear();
  }

  /**
   * This can be optimized by calculating the max height of player (1.25) and the resulting jump boost.
   * @returns
   */
  protected dontJumpSinceCantClear() {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx.state.control.set("jump", true);

    let tooMuchFallDmg = false;

    let simState = this.simulateUntil(
      (state, ticks) => {
        if (!tooMuchFallDmg) {
          tooMuchFallDmg = this.minimizeFallDmg ? state.vel.y < -0.6 : false;
        }
        return (ticks > 0 && state.isCollidedVertically) || state.isInWater;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999 // unneeded since we'll always be reaching our goal relatively easily.
    );

    if (simState.isInLava) return true;

    // if we collide with a block above us, we still don't know if we will make it or not.
    // So continue simulating.
    if (simState.isCollidedVertically && !simState.onGround) {
      simState = this.simulateUntil(
        (state, ticks) => {
          if (!tooMuchFallDmg) {
            tooMuchFallDmg = this.minimizeFallDmg ? state.vel.y < -0.6 : false;
          }
          return (ticks > 0 && (state.onGround || simState.isCollidedHorizontally)) || state.isInWater;
        },
        (state) => {},
        (state, ticks) => {},
        ectx,
        this.bot.world,
        999 // unneeded since we'll always be reaching our goal relatively easily.
      );
    }

    if (this.minimizeFallDmg && tooMuchFallDmg && !simState.isInWater) return true;

    return simState.isCollidedHorizontally && Math.floor(simState.pos.y) <= Math.floor(this.bot.entity.position.y);
  }

  /**
   * TODO: Handle multiple blocks (lazy, do it later on request)
   *
   * Code should jump from collision with a block in front of it.
   * @returns whether bot collides within maxAge ticks or not.
   */
  protected shouldJumpFromCollision(): boolean {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);

    let maxAge = 7;

    // handles vanilla and up to ~5 for both.
    // it's stupid tho, so feel free to change it.
    if (ectx.state.speed > 1 || ectx.state.jumpBoost > 1) {
      let base = 5;
      if (ectx.state.jumpBoost > 1) {
        base -= Math.ceil(ectx.state.jumpBoost / 2);
      }
      maxAge = base + Math.ceil(ectx.state.speed / 10);
    }

    let flag = false;
    const nextTick = this.simulateUntil(
      (state, ticks) => {
        return state.isCollidedHorizontally;
      },
      (state) => { flag = true },
      (state, ticks) => {},
      ectx,
      this.bot.world,
      maxAge
    );
    return flag
  }

  /**
   * Note: this is purposefully cheap.
   * @returns Should we jump or not, depending on leaving edge of block to fall.
   */
  protected shouldJumpSinceBlockEdge(): boolean {
    const nextTick = this.predictForward(this.bot.entity, this.bot.world, 1);
    return this.bot.entity.onGround && !nextTick.onGround;
  }

  /**
   * If we fall, check:
   * 
   * - if we fall too far, don't jump.
   * - if we fall into water, don't jump (handled elsewhere)
   * - if we do jump, we'll end up on a good block (higher than if we didn't jump)
   */
  protected shouldJumpSinceNextBlockEmptyAndAvailableBlock() {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx.state.control.set("jump", true);

    const jumpState = this.simulateUntil(
      (state, ticks) => {
        return (ticks > 0 && state.onGround) || state.isInWater;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      30 // end of jump.
    );

    if (jumpState.pos.y < this.bot.entity.position.y - this.maxBlockOffset) return false;
    if (jumpState.isInWater && this.jumpIntoWater) return false; // handled elsewhere.

    const maxAge = ectx.state.speed > 1 ? jumpState.age - Math.round(Math.log2((ectx.state.speed - 1) * 3)) : jumpState.age;
    const ectx1 = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    const runState = this.simulateUntil(
      (state, ticks) => {
        return state.pos.y < this.bot.entity.position.y;
      },
      (state) => {},
      (state, ticks) => {},
      ectx1,
      this.bot.world,
      maxAge // end of jump.
    );

    const flag = jumpState.pos.y >= this.bot.entity.position.y - this.maxBlockOffset;
    return flag && runState.pos.y < this.bot.entity.position.y;
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
    ectx.state.control.set("jump", true);

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

  /**
   * Jump if we're about to fall into lava.
   * 
   * This can be extended for other various dangers. (TODO)
   */
  protected shouldJumpToAvoidDanger(): boolean {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    this.predictForwardRaw(ectx, this.bot.world, 1);
    ectx.state.control.set("jump", true);
    const finalTick = this.simulateUntil(
      (state, ticks) => {
        return ticks > 0 && state.onGround;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999
    );

    return finalTick.isInLava;
  }
}
