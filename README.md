# Enderbot
*A starboard bot for Discord*

Enderbot is a lightweight yet powerful starboard bot for Discord. It offers unlimited starboards per server, as well as individual starboard configurations.

## Getting started
To start, you should invite the bot using [this link](https://discord.com/api/oauth2/authorize?client_id=739648217553174608&permissions=322640&scope=bot). Once the bot's in your server, you can use `en!add` to add a new starboard. You should be all set from there!

If you'd like to change how the starboard works, you can use these commands:
- `en!tolerance` - change the tolerance of the starboard
- `en!override` - change whether mods auto-star messages
- `en!selfstar` - change whether self-starring counts towards the tolerance
- `en!toremove` - change how many stars are needed to remove a post from the board (due to removed reactions)

## Features
### Unlimited starboards
There are currently no limits to the number of starboards that a server can have, save for channel space and emoji use. If you've got a channel and an emoji, you've got a starboard you can create.

### Individual and global configurations
This bot allows you to set tolerances on a global scale or for each individual starboard. You can also set a moderator override, or whether mods can bypass the tolerance, for each starboard you create.

### Custom emoji support
Ender supports the use of custom emoji for starboard reactions. Just set it up the same as any other starboard, and the bot will handle the logic for you.

### Simple syntax
Most of Ender's commands are simple and intuitive, and can be shortened to single letter/symbol terms. This is part of an effort to make our bots as accessible and easy to use as possible.

## Self hosting
### Requirements
**Node:** 14.0 or above  
**Postgres:** any version  
**Tech:** a VPS or a computer that's usually online  
You'll also want some basic knowledge, especially if you plan to make changes

### Steps
(Assuming you have all the requirements set up)
1. Download this repository and unzip (if applicable) to wherever you want it
2. Open a terminal in the root folder and use `npm i` to install dependencies
3. Copy the `.env.example` rename it to `.env`. Fill it with the correct values
4. Use `node bot` to run the bot

The bot should now be online and responsive :)

## Support and Links
[support server](https://discord.gg/EvDmXGt)  
[our patreon](https://patreon.com/greysdawn)  
[our ko-fi](https://ko-fi.com/greysdawn)
