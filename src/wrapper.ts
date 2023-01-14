import EventEmitter from "events";
import { Bot } from "mineflayer";
import { JumpChecker } from "./autoJumper";



export interface AutoJumperOpts {
    autoJump: boolean,
}

const defaultKeys: AutoJumperOpts = {
    autoJump: false
}



export class AutoJumper extends EventEmitter implements AutoJumperOpts {

    private handler: JumpChecker;
    
    private _autoJump: boolean;

    public get autoJump() {
        return this._autoJump;
    }

    public set autoJump(jump: boolean) {

        if (jump) this.initListeners();
        else this.cleanupListeners();
        this._autoJump = jump;
    }

    public constructor(private bot: Bot, opts: Partial<AutoJumperOpts> = {}) {
        super();
        this.handler = new JumpChecker(bot);
        this.setOpts(Object.assign({}, defaultKeys, opts))
    }

    /**
     * 
     * @param opts 
     */
    public setOpts(opts: Partial<AutoJumperOpts>) {
        for (const key in opts) {
            if (key in this && key in defaultKeys) {
                // @ts-expect-error
                this[key] = opts[key];
            }
        }
    }



    private initListeners() {

    }

    private cleanupListeners() {

    }
}



