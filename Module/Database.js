const { Pool } = require('pg');
var pg_format = require('pg-format');
const bcrypt = require('bcrypt');

class Database
{
	constructor()
	{
		this.client = new Pool(
		{
			host: 'localhost',
			port: 5434,
			user: 'postgres',
			password: 'root',
			database: 'web2lab2',
		});

		this.client.connect();
	}

	// Get all comments for a single round
	async getPoints(username, vulnerable)
	{
		let query = null;
		if (vulnerable == false)
		{
			query = pg_format(`SELECT points FROM users
				WHERE username=%L;`, username);
		}
		else
		{
			query = 'SELECT points FROM users WHERE username=\'' + username + '\'';
		}

		const res = await this.client.query(query);

		if (res.rowCount > 0)
		{
			return res.rows[0].points;
		}

		return 0;
	}

	// Check if user with given username and password exists
	async checkLogin(username, password)
	{
		const res = await this.client.query(pg_format(`SELECT * FROM users WHERE username=%L;`, username));
		if (res.rowCount > 0)
		{
			let equal = bcrypt.compareSync(password, res.rows[0].password);
			if (equal)
			{
				return res.rows[0];
			}
		}

		return null;
	}

	// Transfer points from one user to another
	async transferPoints(fromid, to, points)
	{
		await this.client.query(pg_format(`UPDATE users SET points=points-%L WHERE id=%L;`, points, fromid));
		await this.client.query(pg_format(`UPDATE users SET points=points+%L WHERE username=%L;`, points, to));
	}

	// Insert image into the database
	async postImage(id, url)
	{
		await this.client.query(pg_format(`INSERT INTO images ("user", url) VALUES(%L, %L)`, id, url));
	}

	// Delete imag efrom the database
	async deleteImage(user, id)
	{
		await this.client.query(pg_format('DELETE FROM images WHERE id=%L AND "user"=%L', id, user));
	}

	// Get all the images
	async getAllImages()
	{
		const res = await this.client.query(`
			SELECT
				images.id as imgid,
				images.url as url,
				images.user as userid,
				username as username
			FROM images
			LEFT JOIN users ON (images.user = users.id)`);
		return res.rows;
	}
}

module.exports = new Database();