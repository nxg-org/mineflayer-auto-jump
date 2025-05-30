import { EventEmitter } from "events";
import type { Bot } from "mineflayer";

import { JumpChecker } from "./autoJumper";
import { AutoJumperEmitter, AutoJumperOpts, DefaultHandlerKeys, DefaultKeys, JumpCheckerOpts } from "./utils";

export class AutoJumper extends (EventEmitter as { new (): AutoJumperEmitter }) implements AutoJumperOpts {
  private handler: JumpChecker;
  private lastJump: boolean = false;
  private _enabled: boolean = false;
  private _autoReset: boolean = false;


  public cancelOnShift: boolean = false;

  public get enabled() {
    return this._enabled;
  }

  public get autoReset() {
    return this._autoReset;
  }

  public set enabled(enable: boolean) {
    if (enable === this._enabled) return;
    if (enable)   this.bot.on("physicsTick", this.jumpListener);
    else          this.bot.off("physicsTick", this.jumpListener);

    this._enabled = enable;
  }

  public constructor(private bot: Bot, opts: Partial<AutoJumperOpts> = {}) {
    super();
    this.handler = new JumpChecker(bot);
    this.setOpts(Object.assign({}, DefaultKeys, opts));
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  /**
   * Set options straight to the class, inducing setters.
   * @param opts Options.
   */
  public setOpts(opts: Partial<AutoJumperOpts | JumpCheckerOpts>) {
    for (const key in opts) {
      if (key in this && key in DefaultKeys) {
        // @ts-expect-error
        this[key] = opts[key];
      }
      if (key in this.handler && key in DefaultHandlerKeys) {
        // @ts-expect-error
        this.handler[key] = opts[key];
      }
    }
  }

  public shouldJump() {
    return this.handler.shouldJump();
  } 

  public canJump() {
    return this.handler.canJump();
  }

  private jumpListener = () => {

    if (this.cancelOnShift && this.bot.getControlState("sneak")) {
      this.lastJump = false;
      return;
    }

    if (this.handler.shouldJump()) {
      // first jump tick for this type
      if (!this.lastJump) {
        this.emit("shouldJump");
        this.lastJump = true;
      }
      this.bot.setControlState("jump", true);
    } else {
      if (this.lastJump) {
        this.lastJump = false;
        this.bot.setControlState("jump", false);
      }
    }
  }
}
