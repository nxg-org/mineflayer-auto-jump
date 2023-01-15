const {createBot} = require("mineflayer");
const {loader} = require("../dist/index")


const bot = createBot({
    host: "localhost",
    port: 25566,
    username: "autoJumper",
    auth: "offline"
})



bot.loadPlugin(loader);



bot.on("spawn", () => {
    bot.autoJumper.setOpts({autoJump: true});
    bot.setControlState("forward", true)
    bot.setControlState("sprint", true)
})
