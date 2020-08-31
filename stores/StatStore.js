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
				await this.db.query(`INSERT INTO stats (
					server_id,
					starboard,
					user_id,
					stars_added,
					posts_made
				) VALUES ($1, $2, $3, $4, $5)`,
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
				await this.db.query(`INSERT INTO stats (
					server_id,
					starboard,
					user_id,
					stars_added,
					posts_made
				) VALUES ($1, $2, $3, $4, $5)`,
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
				var data = await this.db.query(`SELECT * FROM stats WHERE server_id = $1 ORDER BY stars_added DESC`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data?.rows[0]) {
				if(filters.board) data.rows = data.rows.filter(x => x.starboard == filters.board);
				if(filters.user) data.rows = data.rows.filter(x => x.user_id == filters.user);
				if(filters.count) data.rows = data.rows.slice(0, filters.count);
				res(data.rows)
			} else return res(undefined);
		})
	}

	//user is optional
	async getGlobal(filters = {}) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`
					select stats.*, user_configs.status
					from stats
					left join user_configs on stats.user_id = user_configs.user_id
					where coalesce(user_configs.status, True) = True
				`);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data?.rows[0]) {
				if(filters.user) data.rows = data.rows.filter(x => x.user_id == filters.user);
				if(filters.count) data.rows = data.rows.slice(0, filters.count);
				res(data.rows)
			} else return res(undefined);
		})
	}

	async update(server, board, user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`
					UPDATE stats
					SET ${Object.keys(data).map((k, i) => k+"=$"+(i+4)).join(",")}
					WHERE server_id = $1 AND starboard = $2 AND user_id = $3
				`, [server, board, user, ...Object.values(data)]);
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
				await this.db.query(`
					DELETE FROM stats
					WHERE server_id = $1 AND starboard = $2 AND user_id = $3
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