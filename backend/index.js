const express = require('express')
const app = express()
const {ExpressPeerServer} = require('peer')
const http = require('http')

// const fs = require('fs')
// const path = require('path')

// old
const server = http.createServer(app)
// NEW HTTPS
// const server = require('https').createServer(
// 	{
// 		key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
// 		cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
// 	},
// 	app
// )
// @ts-ignore
const io = require('socket.io')(server, {
	// cors fixing from: https://stackoverflow.com/a/64733801/10012446
	cors: {
		// IMPORATANT: Add your frontend url here to allow for cors issue:
		origin: ['http://localhost:3000', 'http://192.168.18.3:3000', 'http://124.253.36.113:3000', 'http://letsjoin.ml', 'https://letsjoin.ml'],
		methods: ['GET', 'POST'],
		allowedHeaders: ['my-custom-header'],
		credentials: true,
	},
})

const cors = require('cors')
const PORT = process.env.PORT || 8080

// this is the site which we allow socket.io connections
// io.set('origins', 'http://localhost:3000');

let log = console.log

app.disable('x-powered-by') // This is to disable x-powered-by header which is only useful if you are using 'helmet', and you must disable this header as the target hackers can launch application specific hacks on your server🤑︎.
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
	log(`${req.method} @ ${req.path}`)

	next()
})

app.get('/', (req, res) => {
	return res.send("You made a get request on '/' endpoint.")
})

io.on('connection', (socket) => {
	socket.on('join-room', (roomId, userId) => {
		console.log('JOIN ROOM(server): got roomid:', roomId, 'and userId:', userId)
		socket.join(roomId)

		try {
			socket.to(roomId).emit('user-connected', userId)
			// below code isn't working idk why..
			// socket.to(roomId).broadcast.emit('user-connected', userId)

			socket.on('disconnect', () => {
				log('disconnect event fired..', userId)
				socket.to(roomId).emit('user-disconnected', userId)
				// not working idk why..!
				// socket.to(roomId).broadcast.emit('user-disconnected', userId)
			})
		} catch (e) {
			log('ERROR ~Sahil::', e.message)
		}
		// socket.broadcast.emit('user-connected', userId)

		// TODO: from future..
		// socket.on('disconnect', () => {
		// 	socket.to(roomId).broadcast.emit('user-disconnected', userId)
		// })
	})
})

const server2 = server.listen(PORT, function () {
	console.log('express running on', PORT, '...')
})

const peerServer = ExpressPeerServer(server2, {
	// @ts-ignore
	debug: true,
	allow_discovery: true,
})

// src: https://github.com/peers/peerjs-server/issues/86#issuecomment-913825766
app.use('/', a, peerServer) // Enable peer server!
// ALERTY, ^^ DONT CHANGE THE PATH!!
function a(req, res, next) {
	log('path:', req.path, 'req.query:', req.query)
	next()
}
