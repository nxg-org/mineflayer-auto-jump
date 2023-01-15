import type { Bot } from "mineflayer"
import type { IndexedData } from "minecraft-data"
import { AutoJumper } from "./wrapper"
import { initSetup } from "@nxg-org/mineflayer-physics-util"

declare module "mineflayer" {

    interface Bot {
        registry: IndexedData
        autoJumper: AutoJumper
        
    }

}


export function loader(bot: Bot) {
    initSetup((bot as any).registry);
    bot.autoJumper = new AutoJumper(bot);
}