import { BaseSimulator, BotcraftPhysics, EntityPhysics, EPhysicsCtx } from "@nxg-org/mineflayer-physics-util";
import { AABB, AABBUtils } from "@nxg-org/mineflayer-util-plugin";
import type { Bot } from "mineflayer";
import type { Block } from "prismarine-block";

import { JumpCheckerOpts } from "./utils";
import { Vec3 } from "vec3";

function tp({ x, y, z }: { x: number; y: number; z: number }, ...args: any[]) {
  console.log(`${x} ${y} ${z}`, ...args);
}

export class JumpChecker extends BaseSimulator implements JumpCheckerOpts {
  public strictBlockCollision: boolean = true; // if true, only jump if collision block is ABOVE current walking level.
  public jumpOnAllEdges: boolean = false;
  public jumpToClearSmallDip: boolean = false;
  public jumpIntoWater: boolean = false;
  public maxBlockOffset: number = 0;
  public minimizeFallDmg: boolean = false;
  public debug: boolean = false;

  public constructor(private bot: Bot) {
    super(new BotcraftPhysics(bot.registry));
  }

  public debugInfo() {
    console.debug(
      `[AUTOJUMP] DEBUG INFO:\n` +
        `don't jump since can't clear: ${this.dontJumpSinceCantClear()}\n` +
        `should jump from collision: ${this.shouldJumpFromCollision()}\n` +
        `should jump to avoid danger: ${this.shouldJumpToAvoidDanger()}\n` +
        `should jump into water: (jumpOnAllEdges=${this.jumpOnAllEdges}, jumpIntoWater=${this.jumpIntoWater}) ${
          !this.jumpOnAllEdges && this.jumpIntoWater ? this.shouldJumpIntoWater() : false
        }\n` +
        `should jump since next block empty and available block (jumpToClearSmallDip=${this.jumpToClearSmallDip}): ${
          this.jumpToClearSmallDip ? this.shouldJumpSinceNextBlockEmptyAndAvailableBlock() : false
        }\n` +
        `should jump since block edge (jumpOnAllEdges=${this.jumpOnAllEdges}): ${
          this.jumpOnAllEdges ? this.shouldJumpSinceBlockEdge() : false
        }\n` +
        `jumping: ${this.bot.getControlState("jump")}\n`
    );
  }

  public shouldJump() {
    if (
      this.bot.getControlState("back") ||
      this.bot.getControlState("forward") ||
      this.bot.getControlState("left") ||
      this.bot.getControlState("right") // && this.bot.entity.onGround
    ) {
      if (this.debug) {
        this.debugInfo();
        tp(this.bot.entity.position, "pos");
      }
      if (this.dontJumpSinceCantClear() || this.dontJumpSinceFasterToWalk()) {
        return false;
      }

      return (
        this.shouldJumpFromCollision() ||
        this.shouldJumpToAvoidDanger() ||
        (!this.jumpOnAllEdges && this.jumpIntoWater ? this.shouldJumpIntoWater() : false) ||
        (this.jumpToClearSmallDip ? this.shouldJumpSinceNextBlockEmptyAndAvailableBlock() : false) ||
        (this.jumpOnAllEdges ? this.shouldJumpSinceBlockEdge() : false)
      );
    }
    return false;
  }

  public canJump() {
    if (this.debug) {
      this.debugInfo();
      tp(this.bot.entity.position, "pos");
    }
    return !this.dontJumpSinceCantClear() && !this.dontJumpSinceFasterToWalk();
  }

  protected findWantedXZDirection() {
    const strafe =
      ((this.bot.getControlState("left") as unknown as number) - (this.bot.getControlState("right") as unknown as number)) * 0.98;
    const forward =
      ((this.bot.getControlState("forward") as unknown as number) - (this.bot.getControlState("back") as unknown as number)) * 0.98;

    const yaw = Math.PI - this.bot.entity.yaw;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);

    const vel = this.bot.entity.velocity.clone();
    vel.x += strafe * cos - forward * sin;
    vel.z += forward * cos + strafe * sin;
    vel.y -= vel.y; // only XZ
    return vel;
  }

  protected findAllTouchingBlocks(pos: Vec3): Block[] {
    const bb = AABBUtils.getPlayerAABB({ position: pos, width: 0.6 }).expand(0.01, -0.01, 0.01);
    const blocks = [];
    const seen = new Set();
    for (let x = bb.minX; x <= bb.maxX; x += 0.3) {
      for (let y = bb.minY; y <= bb.maxY; y += 0.3) {
        for (let z = bb.minZ; z <= bb.maxZ; z += 0.3) {
          const pos = new Vec3(x, y, z).floor();
          if (seen.has(pos.toString())) continue;
          seen.add(pos.toString());
          const block = this.bot.blockAt(pos);
          if (!block || block.boundingBox == "empty") continue;
          // check for intersection.
          const blBBs = block.shapes.map((val) => AABB.fromBlock(block.position));
          for (const blBB of blBBs) {
            if (blBB.intersects(bb)) {
              blocks.push(block);
              break;
            }
          }
        }
      }
    }
    return blocks;
  }

  protected getIntersectionPoints(pos: Vec3, blocks: Block[]) {
    const stateBB = AABBUtils.getPlayerAABB({ position: pos, width: 0.6 }).expand(0.01, -0.01, 0.01);
    const intersections = [];
    for (const block of blocks) {
      if (!block || block.boundingBox == "empty") continue;
      const blBBs = block.shapes.map((val) => AABB.fromBlock(block.position));
      for (const blBB of blBBs) {
        const intersection = blBB.intersect(stateBB);
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }
    return intersections;
  }

  protected dontJumpSinceFasterToWalk() {
    return false;
  }

  /**
   * This can be optimized by calculating the max height of player (1.25) and the resulting jump boost.
   * @returns true = don't jump
   */
  protected dontJumpSinceCantClear() {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx.state.control.set("jump", true);

    let tooMuchFallDmg = false;

    let collided: Vec3 | undefined;
    let state = this.simulateUntil(
      (state, ticks) => {
        if (!tooMuchFallDmg) tooMuchFallDmg = this.minimizeFallDmg ? state.vel.y < -0.6 : false;
        if (collided == null || state.vel.y > 0) {
          if (state.isCollidedHorizontally) {
            collided = state.pos.clone();
          }
        }
        return (ticks > 0 && state.isCollidedVertically) || state.isInWater;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999 // unneeded since we'll always be reaching our goal relatively easily.
    );

    if (state.isInLava) return true;

    // if we have a horizontal collision, check to see if it is two-blocks high.
    // if so, we cannot jump.

    if (collided != null) {
      const blocks = this.findAllTouchingBlocks(collided);
      const startYFloor = Math.floor(this.bot.entity.position.y);
      if (collided.distanceTo(this.bot.entity.position) > Math.SQRT2) return true; // no point in jumping right now.

      const twoHigh = blocks.filter((val) => val.position.y >= startYFloor + 1);

      // if there are high blocks, we cannot jump if the player landed on the same y level.
      if (twoHigh.length > 0) {
        if (state.pos.y < startYFloor + 1) return true;
      }
    }

    // if we collide with a block above us, we still don't know if we will make it or not.
    // So continue simulating.
    if (state.isCollidedVertically && !state.onGround) {
      state = this.simulateUntil(
        (state, ticks) => {
          if (!tooMuchFallDmg) {
            tooMuchFallDmg = this.minimizeFallDmg ? state.vel.y < -0.6 : false;
          }
          return (ticks > 0 && (state.onGround || state.isCollidedHorizontally)) || state.isInWater;
        },
        (state) => {},
        (state, ticks) => {},
        ectx,
        this.bot.world,
        999 // unneeded since we'll always be reaching our goal relatively easily.
      );
    }

    if (this.minimizeFallDmg && tooMuchFallDmg && !state.isInWater) return true;

    return state.isCollidedHorizontally && Math.floor(state.pos.y) <= Math.floor(this.bot.entity.position.y);
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

    const startBlock = this.bot.blockAt(this.bot.entity.position);
    if (!startBlock) return false;

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
      (state) => {
        flag = true;
      },
      (state, ticks) => {},
      ectx,
      this.bot.world,
      maxAge
    );

    const endBlock = this.bot.blockAt(nextTick.pos);
    if (!endBlock) return false;

    if (!this.strictBlockCollision) return flag;

    if (endBlock.position.y < startBlock.position.y) return false;

    return flag && this.shouldJumpSinceCollidedAndNeedToClear(this.bot.entity.position, ectx.state.speed, ectx.state.jumpBoost);
  }

  protected shouldJumpSinceCollidedAndNeedToClear(orgPos: Vec3, speed: number, jump: number) {
    const ectx = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx.state.control.set("jump", true);
    const nextState = this.simulateUntil(
      (state, ticks) => {
        return ticks > 0 && state.onGround;
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      999
    );

    return nextState.pos.y > orgPos.y;
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

    const startBlock = this.bot.blockAt(this.bot.entity.position);
    if (!startBlock) return false;

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

    const endJump = this.bot.blockAt(jumpState.pos);
    if (!endJump) return false;

    if (endJump.position.equals(startBlock.position)) return false; // fix for jumping on the same block, but walking takes us into crevice.

    if (jumpState.pos.y < this.bot.entity.position.y - this.maxBlockOffset) return false;
    if (jumpState.isInWater && this.jumpIntoWater) return false; // handled elsewhere.

    const sprinting = this.bot.getControlState("sprint");
    let maxAge = ectx.state.speed > 1 ? jumpState.age - Math.round(Math.log2((ectx.state.speed - 1) * 3)) : jumpState.age;
    if (!sprinting) {
      maxAge /= 2;
    }
    const ectx1 = EPhysicsCtx.FROM_BOT(this.ctx, this.bot);
    ectx1.state.control.set("jump", false);

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
        return state.isInLava || state.isInWater || (ticks > 0 && state.onGround);
      },
      (state) => {},
      (state, ticks) => {},
      ectx,
      this.bot.world,
      50 // unneeded since we'll always be reaching our goal relatively easily. // APPARENTLY NOT THE CASE.
    );

    return !(nextTick.onGround && !nextTick.isInWater);
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
