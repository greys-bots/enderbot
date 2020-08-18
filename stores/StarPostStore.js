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
			var guild = this.bot.guilds.resolve(server);
			var chan = guild.channels.resolve(channel);
			var attachments = [];
			if(msg.attachments.size > 0) {
				msg.attachments = msg.attachments.map(a => a);
				for(var attachment of msg.attachments) {
					var req = await axios(attachment.url, {responseType: 'arraybuffer'});
					req = Buffer.from(req.data, 'binary');
					if(req.length > 8000000) continue;
					var att = new MessageAttachment(req);
					att.setName(attachment.name);
					attachments.push(att);
				}
			}

			var embed = new MessageEmbed({
				author: {
					name: `${msg.author.username}#${msg.author.discriminator}`,
					icon_url: msg.author.avatarURL()
				},
				footer: {
					text: chan.name
				},
				description: (msg.content || "*(file only)*") + `\n\n[Go to message](https://discordapp.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
				timestamp: new Date(msg.createdTimestamp).toISOString()
			});

			try {
				var message = await chan.send(
					`${data.emoji.includes(":") ? `<${data.emoji}>` : data.emoji} ${data.count}`,
				[
					embed,
					...attachments
				]);
				await this.db.query(`INSERT INTO star_posts (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, message.id, msg.id, data.emoji])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		
			res(await this.get(server, message));
		})
	}

	//for migrations/indexing existing messages
	async index(server, channel, message, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO star_posts (
					server_id,
					channel_id,
					message_id,
					original_id,
					emoji
				) VALUES ($1,$2,$3,$4,$5)`,
				[server, channel, message, data.original_id, data.emoji])
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
		
			res(await this.get(server, message));
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

	async update(server, message, data = {}) {
		return new Promise(async (res, rej) => {
			//no database updates needed! yay!
			try {
				var post = await this.get(server, message);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			try {
				if(data.count > 0) {
					var guild = this.bot.guilds.resolve(server);
					var channel = guild.channels.resolve(post.channel_id);
					var msg = await channel.messages.fetch(message);
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

			var msg = react.message;
			try {
				if(msg.partial) msg = await msg.fetch();
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.channel.guild) return res();

			var emoji = react.emoji.id ? `:${react.emoji.name}:${react.emoji.id}` : react.emoji.name;
			var board = await this.bot.stores.starboards.getByEmoji(msg.guild.id, emoji);
			if(!board) return res();
			var cfg = await this.bot.stores.configs.get(msg.guild.id);
			var tolerance = board.tolerance || cfg?.tolerance || 2;
			var member = msg.guild.members.cache.find(m => m.id == user.id);
			if(!member) return rej("Member not found.");

			var orig = await this.getByOriginal(msg.guild.id, msg.id);
			var post = await this.get(msg.guild.id, msg.id);

			var scc;
			if(post) return res();
			//handle posts getting on multiple starboards
			else if(orig?.[0] && orig.find(p => p.starboard.channel_id == board.channel_id)){
				orig = orig.find(p => p.channel_id == board.channel_id);
				scc = await this.update(msg.guild.id, orig.message_id, {emoji: emoji, count: react.count || 0});
			} else if(react.count >= tolerance || (board.override && member.permissions.has("MANAGE_MESSAGES")))
				scc = await this.create(msg.guild.id, board.channel_id, msg, {emoji: emoji, count: react.count || 0});
			
			res(scc);
		})
	}

	async handleReactionRemove(react, user) {
		return new Promise(async (res, rej) => {
			var msg = react.message;
			try {
				if(msg.partial) msg = await msg.fetch();
			} catch(e) {
				if(!e.message.toLowerCase().includes("unknown message")) console.log(e);
				return rej(e.message);
			}

			if(!msg.channel.guild) return res();

			var reaction = react.emoji.id ? `:${react.emoji.name}:${react.emoji.id}` : react.emoji.name;
			var post = await this.getByOriginal(msg.channel.guild.id, msg.id);
			if(!post?.[0]) return;
			post = post.find(p => p.starboard.emoji == reaction);
			if(!post) return;

			if(react.count > 0) {
				await this.update(post.server_id, post.message_id, {emoji: reaction, count: react.count || 0});
				return;
			}

			var guild = this.bot.guilds.resolve(msg.guild.id);
			var channel = guild.channels.resolve(post.channel_id);
			var message = await channel.messages.fetch(post.message_id);

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
				var guild = this.bot.guilds.resolve(msg.guild.id);
				var channel = guild.channels.resolve(post.channel_id);
				var message = await channel.messages.fetch(post.message_id);

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
