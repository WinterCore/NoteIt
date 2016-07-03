const express = require("express");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(session);
const ObjectId = require('mongodb').ObjectID;
const app = express();
//bcrypt stuff
const bcrypt = require('bcrypt');
const saltRounds = 10;

// const MongoURI = "mongodb://wintercore:12345@localhost:27017/note?authSource=admin";
const MongoURI = OPENSHIFT_note_DB_URL;

function generatePasswordSalt(args) {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(saltRounds, function (err, salt) {
			if (err) {
				reject(err);
			} else {
				args.salt = salt;
				resolve(args);
			}
		});
	});
}
function generatePasswordHash(args) {
	return new Promise((resolve, reject) => {
		bcrypt.hash(args.password, args.salt, function (err, hash) {
			if (err) {
				reject(err);
			} else {
				args.hash = hash;
				resolve(args);
			}
		});
	});
}
function returnJsonError(res) {
	return res.json({error: true});
}
function checkLoggedIn(req) {
	return req.session && req.session.userId;
}
function checkParams(params) {
	return params.every(param => param[0] && param[0].length >= param[1])
}
function dbConnect() {
	return new Promise((resolve, reject) => {
		MongoClient.connect(MongoURI, function(err, db) {
			if (err) reject(err);
			else resolve(db);
		});
	});
}
function checkUsernameExists(args) {
	return new Promise((resolve, reject) => {
		args.db.collection('note').findOne({username: args.username}, function (err, doc) {
			if (err) throw new Error(err);
			if (doc) {
				reject();
			} else {
				resolve(args);
			}
		});
	});
}
function createNewUser(args) {
	args.db.collection('note').insertOne(
		{
			name: args.name, 
			username: args.username, 
			hash: args.hash, 
			notes: []
		},
		function (err, result) {
			if (err) throw new Error(err);
			args.req.session.userId = result.insertedId.toHexString();
			args.res.json({error: false});
		}
	);
}
function getHashFromTheDatabase(args) {
	return new Promise((resolve, reject) => {
		args.db.collection('note').findOne({username: args.username}, {_id: 1, hash: 1}, function (err, doc) {
			if (err) throw new Error(err);
			if (doc) {
				args._id = doc._id.toHexString();
				args.hash = doc.hash;
				resolve(args);
			} else {
				reject();
			}
		});
	});
}
function checkForPassword(args) {
	bcrypt.compare(args.password, args.hash, function (err, match) {
		console.log(match);
		if (err) throw new Error(err);
		if (match) {
			args.req.session.userId = args._id;
			args.res.json({error: false});
		} else {
			returnJsonError(args.res);
		}
	});
}
function initExpress(db) {
	//serving css and js files
	app.use(express.static("css"));
	app.use(express.static("js"));
	app.use(express.static("img"));
	app.use(express.static("node_modules/jquery/dist"));

	app.set("view engine", "pug");
	app.set("views", "public");

	//initializing express-session
	app.use(cookieParser());
	app.use(session(
		{
			secret: "^UIFMPx4c=kC1-$mBB^Rz!h_m",
			store: new MongoStore({
				url: MongoURI
			}),
		    resave: false,
		    saveUninitialized: false
		}
	));

	app.use(bodyParser.urlencoded({extended: true}));

	//handing logging in
	app.post('/login', function (req, res) {
		if (!checkParams([[req.body.username, 3], [req.body.password, 6]])) {
			returnJsonError(res);
			return;
		}
		var username = req.body.username.toLowerCase(),
			password = req.body.password;
		getHashFromTheDatabase({req, res, username, password, db})
			.then(checkForPassword)
			.catch(err => Console.error(new Error(err)));
	});

	//handing signing up
	app.post('/signup', function (req, res) {
		if (!checkParams([[req.body.username, 3], [req.body.password, 6], [req.body.name, 3]])) {
			returnJsonError(res);
			return;
		}
		var username = req.body.username.toLowerCase(),
			password = req.body.password,
			name = req.body.name;
		checkUsernameExists({name, username, password, db, res, req})
			.then(generatePasswordSalt)
			.then(generatePasswordHash)
			.then(createNewUser)
			.catch(err => res.json({error: "DatabaseError"}));
	});

	app.post('/createNote', function (req, res) {
		var content = req.body.content,
			title = req.body.title;
		if (!checkParams([[content, 1], [title, 1]])) {
			res.json({error: true});
			return;
		}
		var generatedId = new ObjectId();
		db.collection('note').updateOne(
			{
				_id: ObjectId.createFromHexString(req.session.userId)
			},
			{
				$push: {
					notes: {
						_id: generatedId,
						content: content.replace(/\r\n|\r|\n/g, "<br />"),
						title
					}
				}
			},
			function (err, result) {
				if (err) throw new Error(err);
				res.json({error: false, insertId: generatedId.toHexString()});
			}
		);
	});

	//Deleting notes
	app.delete('/deleteNote', function (req, res) {
		var noteId = req.body.id;
		if (noteId && checkLoggedIn(req)) {
			db.collection('note').updateOne(
				{
					_id: ObjectId.createFromHexString(req.session.userId)
				},
				{
					$pull: {
						notes: {
							_id: ObjectId.createFromHexString(noteId)
						}
					}
				},
				function (err, result) {
					if (err) throw new Error(err);
					res.json({deleted: true});
					return;
				}
			);
		}
	});

	app.get('/', function (req, res) {
		if (checkLoggedIn(req)) {
			res.redirect('/dashboard');
			return;
		}
		res.locals.title = "NoteIt a simple app for writing notes.";
		res.render("index");
	});

	app.get('/dashboard', function (req, res) {
		if (!checkLoggedIn(req)) {
			res.redirect('/');
			return;
		}
		db.collection('note').findOne({_id: new ObjectId(req.session.userId)}, function (err, doc) {
			if (err) throw new Error(err);
			doc.notes.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
			res.locals = doc;
			res.render("dashboard");
		});
	});

	app.get('/logout', function (req, res) {
		req.session.destroy(function (err) {
			if (err) throw new Error(err);
			res.redirect('/');
		});
	});

	//Starting the server
	app.listen(process.env.OPENSHIFT_NODEJS_PORT, function () {
		console.log("Listening on port", process.env.OPENSHIFT_NODEJS_PORT);
	});
}
dbConnect()
	.then(initExpress)
	.catch(err => console.error(new Error(err)));