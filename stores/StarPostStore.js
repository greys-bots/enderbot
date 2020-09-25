const {Collection, MessageAttachment, MessageEmbed} = require("discord.js");
const fs = require('fs');
const axios = require("axios");

class StarPostStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on("messageReactionAdd", (...args) => {
			try {
				this.handleReactions(...args)
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageReactionRemove", async (...args) => {
			try {
				this.handleReactionRemove(...args);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageReactionRemoveAll", async (msg) => {
			try {
				this.handleReactionRemoveAll(msg);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageDelete", async (msg) => {
			try {
				this.delete(msg.channel.guild.id, msg.id);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on("messageBulkDelete", async (msgs) => {
			for(var msg of msgs) {
				try {
					this.delete(msg.channel.guild.id, msg.id);
				} catch(e) {
					console.log(e);
				}
			}
		})

		this.bot.on("channelDelete", async (chan) => {
			try {
				await this.deleteByChannel(chan.guild.id, chan.id);
			} catch(e) {
				console.log(e);
			}
		})

		this.bot.on('guildDelete', async (guild) => {
			await this.deleteAll(guild.id);
		})
	}

	async create(server, channel, msg, data = {}) {
		return new Promise(async (res, rej) => {
			var chan = await this.bot.channels.fetch(channel);

			var embed = new MessageEmbed({
				author: {
					name: `${msg.author.username}#${msg.author.discriminator}`,
					icon_url: msg.author.avatarURL()
				},
				description: (msg.content || "*(file only)*"),
				image: {
					url: msg.attachments.first()?.url
				},
				fields: [
					{name: "Message Link", value: `[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`}
				],
				footer: {
					text: chan.name +
						  (msg.attachments.size > 0 ? ' | See original for full attachments.' : '')
				},
				timestamp: new Date(msg.createdTimestamp).toISOString()
			});

			try {
				var message = await chan.send({
					content: `${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,
					embed
				});
				await this.db.query(`INSERT INTO star_posts (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji,
					star_count
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[server, channel, message.id, msg.id, data.emoji, data.count])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		
			res(await this.get(server, message));
		})
	}

	async index(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO star_posts (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji,
					star_count
				) VALUES ($1,$2,$3,$4,$5,$6)`,
				[server, channel, message, data.original_id, data.emoji, data.count])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		
			res();
		})
	}

	async get(server, message, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			try {
				//second line grabs the correct starboard and returns it
				//as a prop specifically called "starboard"
				var data = await this.db.query(`
					SELECT star_posts.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = star_posts.channel_id
					) AS starboard FROM star_posts WHERE server_id = $1 AND message_id = $2`,
					[server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getByOriginal(server, message) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT star_posts.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = star_posts.channel_id
					) AS starboard FROM star_posts WHERE server_id = $1 AND original_id = $2`,
					[server, message]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT star_posts.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = star_posts.channel_id
					) AS starboard FROM star_posts WHERE server_id = $1`,
					[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async getByChannel(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					SELECT star_posts.*, (
						SELECT row_to_json((SELECT a FROM (SELECT starboards.*) a))
						FROM starboards WHERE starboards.channel_id = star_posts.channel_id
					) AS starboard FROM star_posts WHERE server_id = $1 AND channel_id = $2`,
					[server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async getTop(server, options = {count: 10}) {
		return new Promise(async (res, rej) => {
			try {
				if(options.board) {
					var data = await this.db.query(`
						SELECT DISTINCT * FROM star_posts
						WHERE server_id = $1 AND channel_id = $2
						ORDER BY star_count DESC
						LIMIT $3`,
					[server, options.board, options.count]);
				} else {
					var data = await this.db.query(`
						SELECT DISTINCT * FROM star_posts
						WHERE server_id = $1
						ORDER BY star_count DESC
						LIMIT $2`,
					[server, options.count]);
				}
					
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data.rows?.[0]) {
				var boards = [];
				for(var post of data.rows) {
					var board = boards.find(b => b.channel_id == post.channel_id);
					if(board) post.starboard = board;
					else {
						post.starboard = await this.bot.stores.starboards.get(server, post.channel_id);
						boards.push(post.starboard);
					}
				}
				res(data.rows);
			} else res(undefined);
		})
	}

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				var post = await this.db.query(`
					UPDATE star_posts SET star_count = $1
					WHERE server_id = $2 AND message_id = $3
					RETURNING *`,
					[data.count || 0, server, message])
				post = post.rows[0];
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			try {
				if(data.count > 0) {
					var channel = await this.bot.channels.fetch(post.channel_id);
					var msg = await channel?.messages.fetch(message);
					await msg.edit(
						`${post.emoji.includes(":") ?
						`<${post.emoji}>` :
						post.emoji} ${data.count}`
					);
				} else await this.delete(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}
			res();
		})
	}

	async updateEmoji(server, old_emoji, new_emoji) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE star_posts SET emoji = $1 WHERE server_id = $2 AND emoji = $3`, [new_emoji, server, old_emoji]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}

	async delete(server, message) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM star_posts WHERE server_id = $1 AND message_id = $2`, [server, message]);
				super.delete(`${server}-${message}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var posts = await this.getAll(server);
				await this.db.query(`DELETE FROM star_posts WHERE server_id = $1`, [server]);
				for(var post of posts) super.delete(`${server}-${post.message_id}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async deleteByChannel(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				var posts = await this.getByChannel(server, channel);
				await this.db.query(`DELETE FROM star_posts WHERE server_id = $1 AND channel_id = $2`, [server, channel]);
				for(var post of posts) super.delete(`${server}-${post.message_id}`);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			res();
		})
	}

	async handleReactions(react, user) {
		return new Promise(async (res, rej) => {
			if(this.bot.user.id == user.id) return;
			if(user.bot) return;
			try {
				if(react.partial) react = await react.fetch();
				if(react.message.partial) var msg = await msg.fetch();
				else var msg = react.message;
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.channel.guild) return res();

			var emoji = react.emoji.id ? `:${react.emoji.name}:${react.emoji.id}` : react.emoji.name;
			var board = await this.bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
			if(!board) return res();

			var cfg = await this.bot.stores.configs.get(msg.guild.id);
			if(!(cfg?.self_star || board.self_star) && user.id == msg.author.id) return res();

			var tolerance = board.tolerance || cfg?.tolerance || 2;
			var member = msg.guild.members.cache.find(m => m.id == user.id);
			if(!member) return rej("Member not found.");

			var orig = await this.getByOriginal(msg.guild.id, msg.id);
			var post = await this.get(msg.guild.id, msg.id);

			var scc;
			if(orig?.[0] && orig.find(p => p.starboard.channel_id == board.channel_id)){
				orig = orig.find(p => p.channel_id == board.channel_id);
				scc = await this.update(msg.guild.id, orig.message_id, {emoji: emoji, count: react.count || 0});
			} else if(react.count >= tolerance || (board.override && member.permissions.has("MANAGE_MESSAGES"))) {
				scc = await this.create(msg.guild.id, board.channel_id, msg, {emoji: emoji, count: react.count || 0});
				var owner_stats = await this.bot.stores.stats.get(msg.guild.id, {user: msg.author.id, board: board.channel_id});
				if(owner_stats?.[0]) await this.bot.stores.stats.update(msg.guild.id, board.channel_id, msg.author.id, {posts_made: owner_stats[0].posts_made + 1});
				else await this.bot.stores.stats.create(msg.guild.id, board.channel_id, msg.author.id, {posts_made: 1});
			}

			var stats = await this.bot.stores.stats.get(msg.guild.id, {user: user.id, board: board.channel_id});
			if(stats?.[0]) await this.bot.stores.stats.update(msg.guild.id, board.channel_id, user.id, {stars_added: stats[0].stars_added + 1});
			else await this.bot.stores.stats.create(msg.guild.id, board.channel_id, msg.author.id, {stars_added: 1});
			
			res(scc);
		})
	}

	async handleReactionRemove(react, user) {
		return new Promise(async (res, rej) => {
			var msg = react.message;
			try {
				if(react.partial) react = await react.fetch();
				if(react.message.partial) var msg = await msg.fetch();
				else var msg = react.message;
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.guild) return res();
			var config = await this.bot.stores.configs.get(msg.guild.id);
			var reaction = react.emoji.id ? `:${react.emoji.name}:${react.emoji.id}` : react.emoji.name;
			var post = await this.getByOriginal(msg.channel.guild.id, msg.id);
			if(!post?.[0]) return;
			post = post.find(p => p.starboard.emoji == reaction);
			if(!post) return;
			if(!(config?.self_star || p.starboard.self_star) && user.id == msg.author.id) return res();
			var tolerance = post.starboard?.to_remove || config?.to_remove || 0;

			if(react.count > tolerance) {
				await this.update(post.server_id, post.message_id, {emoji: reaction, count: react.count || 0});
				return;
			}

			var channel = await this.bot.channels.fetch(post.channel_id);
			var message = await channel.messages.fetch(post.message_id);

			var owner_stats = await this.bot.stores.stats.get(msg.guild.id, {user: msg.author.id, board: post.starboard.channel_id});
			if(owner_stats?.[0]) await this.bot.stores.stats.update(msg.guild.id, post.starboard.channel_id, msg.author.id, {posts_made: owner_stats[0].posts_made - 1});

			var stats = await this.bot.stores.stats.get(msg.guild.id, {user: user.id, board: post.starboard.channel_id});
			if(stats?.[0]) await this.bot.stores.stats.update(msg.guild.id, post.starboard.channel_id, user.id, {stars_added: stats[0].stars_added - 1});

			try {
				await message.delete();
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}

	async handleReactionRemoveAll(msg) {
		return new Promise(async (res, rej) => {
			var post = await this.getByOriginal(msg.guild.id, msg.id);
			if(!post) return;

			for(var i = 0; i < post.length; i++) {
				var channel = await this.bot.channels.fetch(post.channel_id);
				var message = await channel.messages.fetch(post.message_id);

				var owner_stats = await this.bot.stores.stats.get(msg.guild.id, {user: msg.author.id, board: post.starboard.channel_id});
			if(owner_stats?.[0]) await this.bot.stores.stats.update(msg.guild.id, post.starboard.channel_id, msg.author.id, {posts_made: owner_stats[0].posts_made - 1});

				try {
					await message.delete();
				} catch(e) {
					console.log(e);
					return rej(e.message);
				}
			}

			res();
		})
	}
}

module.exports = (bot, db) => new StarPostStore(bot, db);
