const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const { auth0Login, auth0Register, auth0RefreshToken } = require('./auth0');
const jwt = require('./jwt')

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';

class Session {
	#sessions = {}

	constructor() {
		try {
			this.#sessions = fs.readFileSync('./sessions.json', 'utf8');
			this.#sessions = JSON.parse(this.#sessions.trim());

			console.log(this.#sessions);
		} catch (e) {
			this.#sessions = {};
		}
	}

	#storeSessions() {
		fs.writeFileSync('./sessions.json', JSON.stringify(this.#sessions), 'utf-8');
	}

	set(key, value) {
		if (!value) {
			value = {};
		}
		this.#sessions[key] = value;
		this.#storeSessions();
	}

	get(key) {
		return this.#sessions[key];
	}

	init(res) {
		const sessionId = uuid.v4();
		this.set(sessionId);

		return sessionId;
	}

	destroy(req, res) {
		const sessionId = req.sessionId;
		delete this.#sessions[sessionId];
		this.#storeSessions();
	}
}

const sessions = new Session();

app.use((req, res, next) => {
	let currentSession = {};
	let sessionId = req.get(SESSION_KEY);

	if (sessionId) {
		currentSession = sessions.get(sessionId);
		if (!currentSession) {
			currentSession = {};
			sessionId = sessions.init(res);
		}
	} else {
		sessionId = sessions.init(res);
	}

	req.session = currentSession;
	req.sessionId = sessionId;

	onFinished(req, () => {
		const currentSession = req.session;
		const sessionId = req.sessionId;
		sessions.set(sessionId, currentSession);
	});

	next();
});

app.get('/', async (req, res) => {
	if (req.session.access_token) {
		const tokenLifetime = req.session.expires_at - Math.floor(Date.now() / 1000);
		if (tokenLifetime <= 30) {
			const response = await auth0RefreshToken(req.session.refresh_token);
			req.session.access_token = response.access_token;
			req.session.expires_at = Math.floor(Date.now() / 1000) + response.expires_in;
			console.log('token refreshed');
			console.log(response);
			jwt.validateJtw(req.session.access_token);
		}

		return res.json({
			username: req.session.username,
			logout: 'http://localhost:3000/logout'
		});
	}
	res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/logout', (req, res) => {
	sessions.destroy(req, res);
	res.redirect('/');
});

app.post('/api/login', async (req, res) => {
	const { login, password } = req.body;
	const auth0Res = await auth0Login(login, password);
	if (auth0Res) {
		req.session.username = login;
		req.session.login = login;
		req.session.access_token = auth0Res.access_token;
		req.session.expires_at = Math.floor(Date.now() / 1000) + auth0Res.expires_in;
		req.session.refresh_token = auth0Res.refresh_token;
		res.json({ token: req.sessionId });
	}
	res.status(401).send();
});

app.post('/api/register', async (req, res) => {
	await auth0Register(req.body.login, req.body.password);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
