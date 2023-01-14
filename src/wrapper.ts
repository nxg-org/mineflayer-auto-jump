import EventEmitter from "events";
import { Bot } from "mineflayer";
import StrictEventEmitter from "strict-event-emitter-types/types/src/index";
import { JumpChecker } from "./autoJumper";

interface AutoJumperEvents {
  shouldJump: () => void;
}

type AutoJumperEmitter = StrictEventEmitter<EventEmitter, AutoJumperEvents>;

export interface AutoJumperOpts {
  autoJump: boolean;
}

const defaultKeys: AutoJumperOpts = {
  autoJump: false,
};

export class AutoJumper extends (EventEmitter as { new (): AutoJumperEmitter }) implements AutoJumperOpts {
  private handler: JumpChecker;

  private _autoJump: boolean;

  public get autoJump() {
    return this._autoJump;
  }

  public set autoJump(jump: boolean) {
    if (jump) {
      this.initListeners();
    } else {
      this.cleanupListeners();
    }
    this._autoJump = jump;
  }

  public constructor(private bot: Bot, opts: Partial<AutoJumperOpts> = {}) {
    super();
    this.handler = new JumpChecker(bot);
    this.setOpts(Object.assign({}, defaultKeys, opts));
  }

  /**
   * Set options straight to the class, inducing setters.
   * @param opts Options.
   */
  public setOpts(opts: Partial<AutoJumperOpts>) {
    for (const key in opts) {
      if (key in this && key in defaultKeys) {
        // @ts-expect-error
        this[key] = opts[key];
      }
    }
  }

  private jumpListener = () => {
    if (this.handler.shouldJump()) {
      this.emit("shouldJump");
      // TODO: perform jump.
      return;
    }
  };

  private initListeners() {
    this.bot.on("physicsTick", this.jumpListener);
  }

  private cleanupListeners() {
    this.bot.removeListener("physicsTick", this.jumpListener);
  }
}
