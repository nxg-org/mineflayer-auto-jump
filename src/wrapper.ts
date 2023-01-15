import { EntityPhysics } from "@nxg-org/mineflayer-physics-util";
import { EventEmitter} from "events";
import { Bot } from "mineflayer";
import { StrictEventEmitter } from "strict-event-emitter-types";
import { defaultHandlerKeys, JumpChecker, JumpCheckerOpts } from "./autoJumper.js";


export interface AutoJumperOpts{
  autoJump: boolean;
}

const DefaultKeys: AutoJumperOpts = {
  autoJump: false,
};


interface AutoJumperEvents {
  shouldJump: () => void;
}

type AutoJumperEmitter = StrictEventEmitter<EventEmitter, AutoJumperEvents>;


export class AutoJumper extends (EventEmitter as { new (): AutoJumperEmitter }) implements AutoJumperOpts {
  private handler: JumpChecker;
  private lastJump: boolean;

  private _autoJump: boolean;

  public get autoJump() {
    return this._autoJump;
  }

  public set autoJump(jump: boolean) {
    if (jump)  this.initListeners();
    else       this.cleanupListeners();

    this._autoJump = jump;
  }

  public constructor(private bot: Bot, opts: Partial<AutoJumperOpts> = {}) {
    super();
    this.handler = new JumpChecker(bot);
    this.setOpts(Object.assign({}, DefaultKeys, opts));
  }

  public enable() {
    this.setOpts({autoJump: true})
  }
  
  public disable() {
    this.setOpts({autoJump: false})
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
