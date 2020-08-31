module.exports = {
	help: ()=> "Set self-star ability globally or for a starboard.",
	usage: ()=> [
		" - Views and optionally clears current global setting.",
		" [(true|1)|(false|0)] - Sets the self-star value globally.",
		" [channel] - Views and optionally clears current board setting.",
		" [channel] [(true|1)|(false|0)] - Sets the self-star value for a starboard."
	],
	desc: ()=> "Self-starring is the ability to have your stars on your own posts count towards "+
			   "the post's star count, as well as your stats. This is enabled by default.",
	execute: async (bot, msg, args) => {		
		var config = await bot.stores.configs.get(msg.guild.id);
		var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"").toLowerCase()));
		if(!chan) return "Channel not found.";
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return "No board found for that channel.";

		switch(args.length) {
			case 0:
				if(!config?.self_star) return "Global self-starring already disabled.";
				
				var message = await msg.channel.send("Self-starring enabled. Would you like to disable it?");
				["✅","❌"].forEach(r => message.react(r));

				var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
				if(confirm.msg) return confirm.msg;

				try {
					await bot.stores.configs.update(msg.guild.id, {self_star: false});
				} catch(e) {
					return 'Error:\n'+e;
				}

				return 'Global self-starring disabled.';
				break;
			case 1:
				if(['1', 'true', '0', 'false'].includes(args[0].toLowerCase())) { //setting global tolerance
					try {
						if(config) await bot.stores.configs.update(msg.guild.id, {self_star: ['1' , 'true'].includes(args[0].toLowerCase()) ? true : false});
						else bot.stores.configs.create(msg.guild.id, {self_star: ['1' , 'true'].includes(args[0].toLowerCase()) ? true : false});
					} catch(e) {
						return "Error:\n"+e;
					}

					return "Global self-starring set.";
				}

				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return 'Channel not found.';
				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) return "No board found for that channel.";

				if(!board.tolerance) return 'Self-starring already disabled for that board.';

				var message = await msg.channel.send("Board self-starring enabled. Would you like to disable it?");
				["✅","❌"].forEach(r => message.react(r));

				var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
				if(confirm.msg) return confirm.msg;

				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {self_star: false});
				} catch(e) {
					return 'Error:\n'+e;
				}

				return 'Board self-starring disabled.';
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
						return `Invalid value given. Refer to \`${bot.prefix}h ss\` for the correct values.`;
				}
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return "Channel not found.";

				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) return "No board found for that channel.";
				
				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {self_star: val});
				} catch(e) {
					return "Error:\n"+e;
				}

				return "Board self-starring set.";
				break;
		}
	},
	permissions: ["MANAGE_CHANNELS"],
	alias: ['ss', 'self'],
	guildOnly: true
}