import EventEmitter from "events";
import { Bot } from "mineflayer";
import { JumpChecker } from "./autoJumper";





export class AutoJumper extends EventEmitter {

    private handler: JumpChecker;


    private _automaticallyJump: boolean;


    public get automaticallyJump() {
        return this._automaticallyJump;
    }


    public set automaticallyJump(jump: boolean) {
        
    }


    public constructor(private bot: Bot) {
        super();
        this.handler = new JumpChecker(bot);
    }

}