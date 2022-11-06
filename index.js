const express = require('express');
const session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const db = require('./Module/Database');
const { futimesSync } = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(express.urlencoded({extended: true})); 
app.use(express.json());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

var csrfAllowed = false;



app.get('/', async (req, res) =>
{
	let points = 0;
	let vulnerable = (req.query.vulnerability != undefined);
	let username = "";

	if (req.query.username != null)
	{
		username = req.query.username;
		points = await db.getPoints(username, vulnerable);
	}

	var options =
	{
		points_for: username,
		points: points,

		sql_vulnerable: vulnerable,
		csrf_vulnerable: csrfAllowed,

		isLoggedIn: false
	};

	if (req.session.loggedIn === true)
	{
		options.isLoggedIn = true;

		options['username'] = req.session.username;
		options['my_id'] = req.session.userid;
		options['my_points'] = await db.getPoints(req.session.username, false);
		options['images'] = await db.getAllImages();

		if (csrfAllowed == false)
		{
			options['csrfToken'] = req.session.uuid;
		}
	}

	res.render('index', options);
});



// API functions
app.get('/api/togglecsrf', (req, res) =>
{
	csrfAllowed = !csrfAllowed;
	res.redirect('/');
});
app.post('/api/login', async (req, res) =>
{
	let result = await db.checkLogin(req.body.username, req.body.password);
	
	if (result != null)
	{
		req.session.loggedIn = true;
		req.session.username = result.username;
		req.session.userid = result.id;
		req.session.uuid = uuidv4();
	}

	res.redirect('/');
});
app.get('/api/logout', (req, res) =>
{
	if (req.session.loggedIn === true)
	{
		req.session.destroy();
	}

	res.redirect('/');
});
app.post('/api/postimage', async (req, res) =>
{
	if (req.session.loggedIn === true)
	{
		await db.postImage(req.session.userid, req.body.url);
	}

	res.redirect('/');
});
app.post('/api/deleteimage', async (req, res) =>
{
	if (req.session.loggedIn === true)
	{
		await db.deleteImage(req.session.userid, req.body.id);
	}

	res.redirect('/');
});
app.get('/api/transferpoints', async (req, res) =>
{
	if (req.session.loggedIn === true)
	{
		if (req.session.userid != req.query.to && (csrfAllowed || req.session.uuid == req.query._csrf))
		{
			await db.transferPoints(req.session.userid, req.query.to, req.query.amount);
		}
	}

	res.redirect('/');
});



app.listen(port, () =>
{
	console.log(`Server is listening on port ${port}`);
});