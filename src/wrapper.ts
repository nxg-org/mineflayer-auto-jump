import { EntityPhysics } from "@nxg-org/mineflayer-physics-util";
import { EventEmitter} from "events";
import { Bot } from "mineflayer";
import { StrictEventEmitter } from "strict-event-emitter-types";
import { defaultHandlerKeys, JumpChecker, JumpCheckerOpts } from "./autoJumper.js";


export interface AutoJumperOpts{
  enabled: boolean;
}

const DefaultKeys: AutoJumperOpts = {
  enabled: false,
};


interface AutoJumperEvents {
  shouldJump: () => void;
}

type AutoJumperEmitter = StrictEventEmitter<EventEmitter, AutoJumperEvents>;


export class AutoJumper extends (EventEmitter as { new (): AutoJumperEmitter }) implements AutoJumperOpts {
  private handler: JumpChecker;
  private lastJump: boolean = false;

  private _enabled: boolean = false;

  public get enabled() {
    return this._enabled;
  }

  public set enabled(jump: boolean) {
    if (jump)  this.initListeners();
    else       this.cleanupListeners();

    this._enabled = jump;
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
  public setOpts(opts: Partial<AutoJumperOpts & JumpCheckerOpts>) {
    for (const key in opts) {
      if (key in this && key in DefaultKeys) {
        // @ts-expect-error
        this[key] = opts[key];
      }
      if (key in this.handler && key in defaultHandlerKeys) {
        // @ts-expect-error
        this.handler[key] = opts[key]
      }
    }
  }



  private jumpListener = async () => {
    if (this.handler.shouldJump()) {
      if (!this.lastJump) {
        this.emit("shouldJump");
        this.lastJump = true;
      }
      this.bot.setControlState("jump", true);
      this.bot.setControlState("jump", false);
    } else {
      if (this.lastJump) this.lastJump = false;
    }


  };

  private initListeners() {
    this.bot.on("physicsTick", this.jumpListener);
  }

  private cleanupListeners() {
    this.bot.removeListener("physicsTick", this.jumpListener);
  }
}
