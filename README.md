# mineflayer-auto-jump

<!-- Generate documentation -->

## Installation

```bash

npm install mineflayer-auto-jump

```

## Usage

<!-- refer to the source files in this project for reference -->

```js

const mineflayer = require('mineflayer')
const {loader: autoJump} = require('@nxg-org/mineflayer-auto-jump')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'player'
})

bot.loadPlugin(autoJump)


bot.autoJump.enable() // it will now auto jump!

```

## API

### `autoJump.enable()`

Enable auto jump

### `autoJump.disable()`

Disable auto jump

### `autoJump.shouldJump()`

Returns if the bot should jump (if we do not jump right now, there will be an issue).

### `autoJump.canJump()`

Returns if the bot is allowed to jump (no jump *needed*, but no detriment to jumping right now).

### `autoJump.strictBlockCollision: boolean`

If true, only jump if the bot is colliding with a block ABOVE current walking level. 
If false, the bot will jump if it is colliding with a block at all.

### `autoJump.jumpOnAllEdges: boolean`

If the bot should jump on all edges. This is mainly used for descending slopes, combined with `maxBlockOffset`.

### `autoJump.jumpIntoWater: boolean`

If the bot should jump into water. Useful if you want to save time when falling into water instead of just falling off of a block.

### `autoJump.maxBlockOffset: number`

The maximum block offset for the bot to consider jumping. It works as `current Y` - `maxBlockOffset` as the threshold for jumping. 

### `autoJump.minimizeFallDmg: boolean`

If the bot should minimize fall damage. Similar to maxBlockOffset set to 3 except also takes into account water falling (allows for a bit more leniency).

### `autoJump.debug: boolean`

If the bot should debug the jump checker. Your console will be spammed. Just report the information to me.

### `autoJump.cancelOnShift: boolean`

If the bot should cancel the jump if the player is holding shift. Useful for sneaking.

## Events

### `autoJump.on('shouldJump', () => {})`

Emitted when the bot should jump.



<!-- 

export const DefaultHandlerKeys: JumpCheckerOpts = {
  strictBlockCollision: true,
  jumpOnAllEdges: false,
  jumpToClearSmallDip: false,
  jumpIntoWater: false,
  maxBlockOffset: 0,
  minimizeFallDmg: false,
  debug: false
};

export interface AutoJumperOpts {
  enabled: boolean;
  cancelOnShift: boolean;
}

export const DefaultKeys: AutoJumperOpts = {
  enabled: false,
  cancelOnShift: false
};


export const DefaultHandlerKeys: JumpCheckerOpts = {
  jumpOnAllEdges: false,
  jumpIntoWater: false,
  maxBlockOffset: 0,
  minimizeFallDmg: false,
  debug: false
};

interface AutoJumperEvents {
  shouldJump: () => void;
}

export type AutoJumperEmitter = StrictEventEmitter<EventEmitter, AutoJumperEvents>;


 -->



