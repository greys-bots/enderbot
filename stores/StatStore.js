const {Collection} = require('discord.js');

class StatStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	//default behavior handles creation
	//with a starboard and user in mind
	//also: "board" is a channel id for the given starboard
	async create(server, board, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`INSERT INTO stats (
					server_id,
					starboard,
					user_id,
					stars_added,
					posts_made
				) VALUES (?,?,?,?,?)`,
				[server, board, user,
				 data.stars_added, //how many stars they've added to posts
				 data.posts_made //how many times posts they've made have gotten on a starboard
				]);
			} catch(e) {
				console.log(e)
				return rej(e.message);
			}

			res(await this.get(server, {board, user}));
		})
	}

	async index(server, board, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`INSERT INTO stats (
					server_id,
					starboard,
					user_id,
					stars_added,
					posts_made
				) VALUES (?,?,?,?,?)`,
				[server, board, user, data.stars_added,  data.posts_made]);
			} catch(e) {
				console.log(e)
				return rej(e.message);
			}

			res();
		})
	}

	//should handle any get needs
	//default gets all for any servers,
	//board gets any stats for a specific board, etc
	async get(server, filters = {}) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.get(`SELECT * FROM stats WHERE server_id = ? ORDER BY stars_added DESC`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data?.[0]) {
				if(filters.board) data = data.filter(x => x.starboard == filters.board);
				if(filters.user) data = data.filter(x => x.user_id == filters.user);
				if(filters.count) data = data.slice(0, filters.count);
				res(data)
			} else return res(undefined);
		})
	}

	//user is optional
	async getGlobal(filters = {}) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.get(`
					select stats.*, user_configs.status
					from stats
					left join user_configs on stats.user_id = user_configs.user_id
					where coalesce(user_configs.status, True) = True
				`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data?.[0]) {
				if(filters.user) stats = stats.filter(x => x.user_id == filters.user);
				
				var stats = [];
				for(var stat of data) {
					var s = stats.findIndex(u => u.user_id == stat.user_id);
					if(s > -1) {
						stats[s].stars_added += stat.stars_added;
						stats[s].posts_made += stat.posts_made;
					} else {
						stats.push({
							user_id: stat.user_id,
							posts_made: stat.posts_made || 0,
							stars_added: stat.stars_added || 0
						})
					}
				}

				if(filters.count) stats = stats.slice(0, filters.count);
				res(stats)
			} else return res(undefined);
		})
	}

	async update(server, board, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`
					UPDATE stats
					SET ${Object.keys(data).map((k, i) => k+"=?").join(",")}
					WHERE server_id = ? AND starboard = ? AND user_id = ?
				`, [...Object.values(data), server, board, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, board, user));
		})
	}

	async delete(server, board, user) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`
					DELETE FROM stats
					WHERE server_id = ? AND starboard = ? AND user_id = ?
				`, [server, board, user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new StatStore(bot, db);