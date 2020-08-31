module.exports = {
	help: ()=> "View current server configs.",
	usage: ()=> [' - Views server configuration.'],
	execute: async (bot, msg, args) => {
		var cfg = await bot.stores.configs.get(msg.guild.id);
		if(!cfg) return 'No config registered.';

		return {embed: {
			title: 'Server Config',
			fields: [
				{name: 'Tolerance', value: cfg.tolerance || '(not set)'},
				{name: 'Remove tolerance', value: cfg.remove_tolerance || '(not set)'},
				{name: 'Override', value: cfg.override ? 'Enabled.' : 'Disabled.'},
				{name: 'Self-starring', value: cfg.self_star ? 'Enabled.' : 'Disabled.'}
			],
			footer: {text: `To view opped users, use \`${bot.prefix}op\`.`}
		}}
	},
	guildOnly: true,
	permissions: ['MANAGE_GUILD'],
	alias: ['cfg']
}