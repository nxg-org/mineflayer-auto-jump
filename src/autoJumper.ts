import EventEmitter from "events";
import type { Bot } from "mineflayer";
import StrictEventEmitter from "strict-event-emitter-types/types/src/index";




interface JumpCheckerEvents {

}


type JumpCheckerEmitter = StrictEventEmitter<EventEmitter, JumpCheckerEvents>;

export class JumpChecker {



  public constructor(private bot: Bot) {
  }



  /**
   * Cache checks per-tick for whether or not the bot should jump.
   * As the check for jumping may potentially be computationally heavy (it is not)
   */
  public shouldJump(): boolean {

    // TODO
    throw new Error("not yet");
  }






}
