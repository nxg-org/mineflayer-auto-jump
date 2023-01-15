import type { Bot } from "mineflayer"
import type { IndexedData } from "minecraft-data"
import { initSetup } from "@nxg-org/mineflayer-physics-util"
import { AutoJumper } from "./wrapper"

declare module "mineflayer" {

    interface Bot {
        registry: IndexedData
        autoJumper: AutoJumper
        
    }

}


export function loader(bot: Bot) {
    initSetup(bot.registry);
    bot.autoJumper = new AutoJumper(bot);
}