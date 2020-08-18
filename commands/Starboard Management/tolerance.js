module.exports = {
	help: ()=> "Set the tolerance for boards (or globally).",
	usage: ()=> [" - Reset global tolerance.",
				 " [number] - Set global tolerance.",
				 " [channel] - Reset specific tolerance.",
				 " [channel] [number] - Set specific tolerance."],
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		switch(args.length) {
			case 0:
				if(!config || !config.tolerance) return "No global tolerance registered for this server.";
				else {
					var messsage = await msg.channel.createMessage(`Current global tolerance: ${config.tolerance}\nWould you like to reset it?`);
					var message = await msg.channel.send("Override enabled. Would you like to disable it?");
					["✅","❌"].forEach(r => message.react(r));

					var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
					if(confirm.msg) return confirm.msg;

					try {
						await bot.stores.configs.update(msg.guild.id, {tolerance: null});
					} catch(e) {
						return 'Error:\n'+e;
					}

					return 'Global tolerance reset.';
				}
				break;
			case 1:
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) { //assume this is setting the global tolerance
					if(isNaN(parseInt(args[0])) || args[0].match(/\d{17,}/)) //Might've mistyped the channel
						return "Channel not found or is invalid.";
					if(args[0] == 0) return 'Tolerance must be greater than zero.'

					try {
						await bot.stores.configs.update(msg.guild.id, {tolerance: parseInt(args[0])});
					} catch(e) {
						return "Error:\n"+e;
					}

					return "Global tolerance set.";
				} else {
					var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
					if(!board) return "No board found for that channel.";
					if(!board.tolerance) return 'Board tolerance already null.';

					var message = await msg.channel.send(`Current board tolerance: ${board.tolerance}. Would you like to reset it?`);
					["✅","❌"].forEach(r => message.react(r));

					var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
					if(confirm.msg) return confirm.msg;

					try {
						await bot.stores.starboards.update(msg.guild.id, chan.id, {tolerance: null});
					} catch(e) {
						return "Error:\n"+e;
					}

					return "Board tolerance reset.";
				}
				break;
			default:
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return "Channel not found.";

				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) return "No board found for that channel.";

				if(args[1] == 0) return 'Tolerance must be greater than zero.';
				
				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {tolerance: parseInt(args[1])});
				} catch(e) {
					return "Error:\n"+e;
				}

				return "Board tolerance set.";
				break;
		}
	},
	permissions: ["MANAGE_CHANNELS"],
	guildOnly: true,
	alias: ["t","tol"]
}