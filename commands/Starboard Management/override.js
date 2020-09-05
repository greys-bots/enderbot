module.exports = {
	help: ()=> "Set moderator override for adding items to the starboard.",
	usage: ()=> [
		" - Views and optionally clears current global setting.",
		" [(true|1)|(false|0)] - Sets the override globally.",
		" - Views and optionally clears current board setting.",
		" [channel] [(true|1)|(false|0)] - Sets the override for a starboard."
	],
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		
		switch(args.length) {
			case 0:
				if(!config?.override) return "Global override already disabled.";
				
				var message = await msg.channel.send("Override enabled. Would you like to disable it?");
				["✅","❌"].forEach(r => message.react(r));

				var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
				if(confirm.msg) return confirm.msg;

				try {
					await bot.stores.configs.update(msg.guild.id, {override: false});
				} catch(e) {
					return 'Error:\n'+e;
				}

				return 'Global override disabled.';
				break;
			case 1:
				if(['1', 'true', '0', 'false'].includes(args[0].toLowerCase())) { //setting global tolerance
					try {
						if(config) await bot.stores.configs.update(msg.guild.id, {override: ['1' , 'true'].includes(args[0].toLowerCase()) ? true : false});
						else await bot.stores.configs.create(msg.guild.id, {override: ['1' , 'true'].includes(args[0].toLowerCase()) ? true : false});
					} catch(e) {
						return "Error:\n"+e;
					}

					return "Global override set.";
				}

				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return 'Channel not found.';
				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) return "No board found for that channel.";

				if(!board.tolerance) return 'Board override already disabled.';

				var message = await msg.channel.send("Board override enabled. Would you like to disable it?");
				["✅","❌"].forEach(r => message.react(r));

				var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
				if(confirm.msg) return confirm.msg;

				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {override: false});
				} catch(e) {
					return 'Error:\n'+e;
				}

				return 'Board override disabled.';
				break;
			default:
				var val;
				switch(args[1].toLowerCase()) {
					case "true":
					case "1":
					case "enable":
						val = true;
						break;
					case "false":
					case "0":
					case "disable":
						val = false;
						break;
					default:
						return `Invalid value given. Refer to \`${bot.prefix}h or\` for the correct values.`;
				}
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return "Channel not found.";

				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) return "No board found for that channel.";
				
				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {override: val});
				} catch(e) {
					return "Error:\n"+e;
				}

				return "Board override set.";
				break;
		}
	},
	permissions: ["MANAGE_CHANNELS"],
	alias: ['m', 'mod', 'o', 'or'],
	guildOnly: true
}
