import { createBot } from "mineflayer";
import { JumpChecker } from "../src/autoJumper";
import { loader } from "../src/index";

const bot = createBot({
  host: "localhost",
  port: 25566,
  username: "autoJumper",
  auth: "offline",
});

bot.loadPlugin(loader);

bot.on("spawn", () => {
  bot.autoJumper.enable();
  bot.autoJumper.setOpts({
    debug: true,               // print debug info, slower.
    enabled: true,             // whether or not to auto jump
    jumpIntoWater: true,       // jump into water (extra distance)
    jumpOnAllEdges: false,     // jump off of every edge
    minimizeFallDmg: false,    // don't jump if induces fall damage
    maxBlockOffset: 0          // max blocks to allow fall (default 0)
  });


  bot.on("chat", (username, message) => {
    let [cmd, ...args] = message.split(" ");
    switch (cmd) {
      case "start":
        bot.setControlState("forward", true);
        bot.setControlState("sprint", true);
        break;
      case "stop":
        bot.setControlState("forward", false);
        bot.setControlState("sprint", false);
        break;

      case "setopts":
        const opts: { [key: string]: boolean } = {};
        args
          .map((a) => {
            const [key, val] = a.split("=");
            return [key, val.toLowerCase() === "true"] as [string, boolean];
          })
          .forEach(([key, val]) => (opts[key] = val));

        bot.autoJumper.setOpts(opts);
        break;
      case "follow":
        bot.on("physicsTick", follow);
        break;
      case "stopfollow":
        bot.off("physicsTick", follow);
        break;
    }
  });
});

function follow() {
  const e = bot.nearestEntity((e) => e.type === "player");
  if (!e) return;

  let minBlockDrop = 0;
  if (bot.entity.position.y > e.position.y) {
    minBlockDrop = (bot.entity.position.y - e.position.y) + 1 // drop 1 block beneath wherever the entity is at right now.
  }
  bot.autoJumper.setOpts({jumpDownDescending: minBlockDrop})
  if (e && bot.entity.onGround) {
    bot.lookAt(e.position.offset(0, e.height, 0), true);
  
  }

  if (bot.entity.position.distanceTo(e.position) < 3) {
    bot.attack(e);
    if (bot.entity.onGround) {
        bot.setControlState("forward", false);
        bot.setControlState("sprint", false)
    }
  } 
  else {
    bot.setControlState("forward", true);
    bot.setControlState("sprint", true)
  }
}
