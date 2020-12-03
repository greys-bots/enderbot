var fs = require('fs');
var dblite = require('dblite');

module.exports = async (bot) => {
	const db = dblite(__dirname + '/../data.sqlite', '-header');

	// promisify
	db.get = function (...args) {
		return new Promise((resolve, reject) => {
			this.query(...args, (err, data) => {
				if(err) {
					return reject(err);
				} else {
					return resolve(data)
				}
			})
		})
	}

	await db.get(`
		CREATE TABLE IF NOT EXISTS configs (
	    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
	        server_id   	TEXT UNIQUE,
	        tolerance 		INTEGER,
	        to_remove 		INTEGER,
	        override 		BOOLEAN,
	        opped 			TEXT[],
	        self_star 		BOOLEAN
	    );

	    CREATE TABLE IF NOT EXISTS stats (
	    	id 				INTEGER PRIMARY KEY AUTOINCREMENT,
	    	server_id 		TEXT,
	    	starboard 		TEXT,
	    	user_id 		TEXT,
	    	stars_added 	INTEGER,
	    	posts_made 		INTEGER
	    );

		CREATE TABLE IF NOT EXISTS starboards (
			id 				INTEGER PRIMARY KEY AUTOINCREMENT,
			server_id 		TEXT,
			channel_id		TEXT UNIQUE,
			emoji			TEXT,
			override		BOOLEAN,
			tolerance		INTEGER,
			to_remove 		INTEGER,
			blacklist		JSONB,
			self_star 		BOOLEAN
		);

		CREATE TABLE IF NOT EXISTS star_posts (
			id 				INTEGER PRIMARY KEY AUTOINCREMENT,
			server_id		TEXT,
			channel_id		TEXT REFERENCES starboards(channel_id) ON DELETE CASCADE,
			message_id 		TEXT,
			original_id 	TEXT,
			emoji 			TEXT,
			star_count		INTEGER
		);

		CREATE TABLE IF NOT EXISTS user_configs (
			id 				INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id 		TEXT,
			status 			BOOLEAN
		);
	`);
	
	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(["__db.js", "__migrations.js", "tmp.js"].includes(file)) continue;
		var tmpname = file.replace(/store\.js/i, "");
		var name =  tmpname[0].toLowerCase() + 
				   (tmpname.endsWith("y") ?
				   	tmpname.slice(1, tmpname.length-1) + "ies" : //ReactCategoryStore.js becomes reactCategories
				    tmpname.slice(1) + "s"); //ProfileStore.js becomes "profiles"

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	return db;
}