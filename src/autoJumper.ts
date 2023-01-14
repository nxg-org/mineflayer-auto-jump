import EventEmitter from "events";
import type { Bot } from "mineflayer";
import StrictEventEmitter from "strict-event-emitter-types/types/src/index";




interface JumpCheckerEvents {

}


type JumpCheckerEmitter = StrictEventEmitter<EventEmitter, JumpCheckerEvents>;

export class JumpChecker extends (EventEmitter as {new(): JumpCheckerEmitter}) {

  private _resultCached: boolean;

  private _shouldJump: boolean = false;


  public constructor(private bot: Bot) {
    super();

    // bot has updated physics and nothing else yet.
    this.bot.prependListener("physicsTick", () => {
      this._resultCached = false;
    })
  }



  /**
   * Cache checks per-tick for whether or not the bot should jump.
   * As the check for jumping may potentially be computationally heavy (it is not)
   */
  public shouldJump(): boolean {
    if (this._resultCached) {
      return this._shouldJump;
    }

    // TODO
    throw new Error("not yet");
  }






}
