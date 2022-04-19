const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io')(server, {
	// cors fixing from: https://stackoverflow.com/a/64733801/10012446
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
		allowedHeaders: ['my-custom-header'],
		credentials: true,
	},
})

const cors = require('cors')
const PORT = 8080

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
		console.log('got roomid:', roomId, 'and userId:', userId)
		socket.join(roomId)

		try {
			socket.to(roomId).emit('user-connected', userId)
			// below code isn't working idk why..
			// socket.to(roomId).broadcast.emit('user-connected', userId)

			socket.on('disconnect', () => {
				socket.to(roomId).emit('user-disconnected', userId)
				// not working idk why..!
				// socket.to(roomId).broadcast.emit('user-disconnected', userId)
			})
			log()
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

server.listen(PORT, function () {
	console.log('express running on', PORT, '...')
})
