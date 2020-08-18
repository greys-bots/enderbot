module.exports = {
	help: ()=> "Add a channel to the server's starboard config.",
	usage: ()=> [" [chanName | chanID | #channel] [:emoji:] - Adds channel and reaction config for the server."],
	desc: ()=> "The emoji can be a custom one.",
	execute: async (bot, msg, args)=> {
		if(!args[0] || !args[1]) return "Please provide a channel and an emoji.";

		var chan = msg.guild.channels.cache.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
		if(!chan) return "Channel not found.";
		var emoji = args[1].replace(/[<>]/g,"");
		
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(board) return "Board already registered for that channel.";
		board = await bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
		if(board) return "Board already registered with that emoji.";

		try {
			await bot.stores.starboards.create(msg.guild.id, chan.id, emoji);
		} catch(e) {
			return "Error:\n"+e;
		}

		return "Starboard created.";
	},
	permissions: ["MANAGE_CHANNELS"],
	guildOnly: true,
	alias: ["a","n","new","+"]
}