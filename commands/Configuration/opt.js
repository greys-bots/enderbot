module.exports = {
	help: ()=> "Opt in or out of global stats.",
	usage: ()=> [
		' - Views your current status.',
		' in - Opts into global statkeeping.',
		' out - Opts out of global statkeeping.'
	],
	execute: async (bot, msg, args) => {
		var config = await bot.stores.userConfigs.get(msg.author.id);

		switch(args[0]?.toLowerCase()) {
			case 'in':
				try {
					await bot.stores.userConfigs.update(msg.author.id, {status: true});
				} catch(e) {
					return 'Error:\n'+e;
				}

				return 'You are now opted into global stats.';
				break;
			case 'out':
				try {
					await bot.stores.userConfigs.update(msg.author.id, {status: true});
				} catch(e) {
					return 'Error:\n'+e;
				}

				return 'You are now opted out of global stats.';
			default:
				if(!config || config.status) return 'You are currently **opted into** global stats.';
				else return 'You are currently **opted out of** global stats.';
				break;
		}
	}
}