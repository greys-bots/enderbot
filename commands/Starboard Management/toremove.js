module.exports = {
	help: ()=> "Set the post remove tolerance globally or per board.",
	usage: ()=> [
		" - Views and optionally clears the current global remove tolerance.",
		" [count] - Sets the global remove tolerance.",
		" [channel] - Views and optionally clears a board's remove tolerance.",
		" [channel] [count] - Sets a board's remove tolerance."
	],
	desc: ()=> 
		"The remove tolerance decides when a post should be deleted from a board. " + 
		"The default tolerance is 0, meaning that a post will only be removed " +
		"if all reactions are also removed.",
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		switch(args.length) {
			case 0:
				if(!config || !config.to_remove) return "No global remove tolerance registered for this server.";
				else {
					var messsage = await msg.channel.createMessage(`Current global remove tolerance: ${config.to_remove}\nWould you like to reset it?`);
					["✅","❌"].forEach(r => message.react(r));

					var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
					if(confirm.msg) return confirm.msg;

					try {
						await bot.stores.configs.update(msg.guild.id, {to_remove: null});
					} catch(e) {
						return 'Error:\n'+e;
					}

					return 'Global remove tolerance reset.';
				}
				break;
			case 1:
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) { //assume this is setting the global tolerance
					if(isNaN(parseInt(args[0])) || args[0].match(/\d{17,}/)) //Might've mistyped the channel
						return "Channel not found or is invalid.";

					try {
						await bot.stores.configs.update(msg.guild.id, {to_remove: parseInt(args[0])});
					} catch(e) {
						return "Error:\n"+e;
					}

					return "Global remove tolerance set.";
				} else {
					var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
					if(!board) return "No board found for that channel.";
					if(!board.to_remove) return 'Board remove tolerance already null.';

					var message = await msg.channel.send(`Current board remove tolerance: ${board.to_remove}. Would you like to reset it?`);
					["✅","❌"].forEach(r => message.react(r));

					var confirm = await bot.utils.getConfirmation(bot, message, msg.author);
					if(confirm.msg) return confirm.msg;

					try {
						await bot.stores.starboards.update(msg.guild.id, chan.id, {to_remove: null});
					} catch(e) {
						return "Error:\n"+e;
					}

					return "Board remove tolerance reset.";
				}
				break;
			default:
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return "Channel not found.";

				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) return "No board found for that channel.";
				
				try {
					await bot.stores.starboards.update(msg.guild.id, chan.id, {to_remove: parseInt(args[1])});
				} catch(e) {
					return "Error:\n"+e;
				}

				return "Board remove tolerance set.";
				break;
		}
	},
	alias: ['rtol', 'removetolerance', 'rmvtol', 'tr', 'tormv', 'trmv']
}