module.exports = {
	help: ()=> "Change the emoji for a starboard.",
	usage: ()=> [' [board] [emoji] - Sets a new emoji for the given starboard.'],
	desc: ()=>
		'NOTE: This will stop all reactions with the old emoji from ' +
		'adding to the post\'s current count, unless changed back.',
	execute: async (bot, msg, args) => {
		if(!args[1]) return 'Please provide a board and the new emoji.';

		var chan = msg.guild.channels.cache.find(ch => ch.id == args[0].replace(/[<#>]/g, "") || ch.name == args[0].toLowerCase());
		if(!chan) return "Channel not found.";
		var emoji = args[1].replace(/[<>]/g,"");
		
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return 'Starboard not found.';

		var exists = await bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
		if(exists) return "Board already registered with that emoji.";

		try {
			await bot.stores.starboards.update(msg.guild.id, chan.id, {emoji});
			await bot.stores.starPosts.updateEmoji(msg.guild.id, board.emoji, emoji);
		} catch(e) {
			return "Error:\n"+e;
		}

		return "Starboard updated.";
	}
}