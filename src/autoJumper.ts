import EventEmitter from "events";
import type { Bot } from "mineflayer";
import { BaseSimulator, EntityPhysics, EPhysicsCtx } from "@nxg-org/mineflayer-physics-util";
import { ControlStateHandler } from "@nxg-org/mineflayer-physics-util/lib/physics/player/playerControls";


export interface JumpCheckerOpts {
  edgeToLiquidOnly: boolean
}


export const defaultHandlerKeys: JumpCheckerOpts = {
  edgeToLiquidOnly: false
}

export class JumpChecker extends BaseSimulator implements JumpCheckerOpts {


  public edgeToLiquidOnly: boolean = false;

  public constructor(private bot: Bot) {
    super(new EntityPhysics((bot as any).registry));
  }


  public shouldJump() {
    if (this.bot.getControlState("back") || this.bot.getControlState("forward") || this.bot.getControlState("left") || this.bot.getControlState("right") ) {
      if (this.dontJumpSinceCantClear()) { 
        return false;
      }
      return this.shouldJumpFromCollision() || this.shouldJumpSinceBlockEdge();
    }
    return false;
  }

  /**
   * This can be optimized by calculating the max height of player (1.25) and the resulting jump boost.
   * @returns 
   */
  protected dontJumpSinceCantClear() {
    const ectx = EPhysicsCtx.FROM_ENTITY(this.ctx, this.bot.entity)
    ectx.state.controlState = ControlStateHandler.COPY_BOT(this.bot as any);

    ectx.state.controlState.set("jump", true);
   
    let flag = false;
    const nextTick = this.simulateUntil(
      (state) => { return state.velocity.y < -0.3 || (flag && state.onGround) },
      (state) => {},
      (state, ticks) => { if (ticks === 1) flag = true },
      ectx,
      this.bot.world,
      999 // unneeded since we'll always be reaching our goal relatively easily.
    );

    return nextTick.isCollidedHorizontally && Math.floor(nextTick.position.x) === Math.floor(this.bot.entity.position.x);
  }

  protected dontJumpSinceNotSafe() {
    const ectx = EPhysicsCtx.FROM_ENTITY(this.ctx, this.bot.entity)
    ectx.state.controlState = ControlStateHandler.COPY_BOT(this.bot as any);

    ectx.state.controlState.set("jump", true);
   
    let flag = false;
    const nextTick = this.simulateUntil(
      (state) => { return state.isInLava || state.position.x - this.bot.entity.position.x < -3 || (flag && state.onGround) },
      (state) => {},
      (state, ticks) => {if (ticks === 1) flag = true },
      ectx,
      this.bot.world,
      50 // unneeded since we'll always be reaching our goal relatively easily.
    );

    console.log(nextTick.age);
    return nextTick.age < 13 && !nextTick.onGround;
  }


  /**
   * TODO: Handle multiple blocks (lazy, do it later on request)
   * 
   * Code should jump from collision with a block in front of it.
   * @returns whether bot collides within maxAge ticks or not.
   */
  protected shouldJumpFromCollision(): boolean {
    const ectx = EPhysicsCtx.FROM_ENTITY(this.ctx, this.bot.entity)
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
      minAge = base + Math.ceil(ectx.state.speed / 5)
    }

    const nextTick = this.simulateUntil(
      (state) => { return state.isCollidedHorizontally; },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      minAge
    );

    return nextTick.age < minAge;
  }


  /**
   * Yes.
   * @returns Should we jump or not, depending on leaving edge of block to fall.
   */
  protected shouldJumpSinceBlockEdge(): boolean {
    const nextTick = this.predictForward(this.bot.entity, this.bot.world, 1, this.bot.controlState as any);

    if (this.edgeToLiquidOnly) {
      const cursor = nextTick.position;
      for (; cursor.y > 0; cursor.y--) {
        const block = this.bot.blockAt(nextTick.position);
        if (block.type === this.bot.registry.blocksByName.air.id) continue;
        if (!isNaN(Number(block?.getProperties()["level"]))) return true;
      }
      return false;
    }

    return !nextTick.onGround;
  }

}
