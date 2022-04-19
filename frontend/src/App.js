import {io} from 'socket.io-client' // docs https://socket.io/docs/v4/client-api/
import {useState, useEffect, useRef} from 'react'
import Peer from 'peerjs' // docs https://www.npmjs.com/package/peerjs
import './App.css'
let log = console.log

// const socket = io('ws://localhost:8080/')
const socket = io('ws://192.168.18.3:8080/')
// const socket = io('/') // from kyle

// FROM peerjs docs: undefined => pick-an-id
// undefined coz we wan't peerjs to create ids for us.
const myPeer = new Peer(undefined, {
	// host: '/',
	host: '192.168.18.3',
	port: 3001,
})
const peers = {}

// # worked with fast-refresh-sideffect
// const myVideo = document.createElement('video')
// myVideo.muted = true

// # worked with fast-refresh-sideffect
// navigator.mediaDevices
// 	.getUserMedia({
// 		video: true,
// 		audio: true,
// 	})
// 	.then((stream) => {
// 		addVideoStream(myVideo, stream)
// 	})

let videoGrid
const FRAME_RATE = 100
function App() {
	const videoRef = useRef(null)
	// const photoRef = useRef(null) // this is more like a frame in a video.

	useEffect(() => {
		videoGrid = document.getElementById('video-grid')
		log('origianl videoGrid', videoGrid)
	}, [])

	useEffect(() => {
		getVideo()

		log('effect..')
	}, [videoRef])

	const getVideo = () => {
		navigator.mediaDevices
			.getUserMedia({video: {width: 300}})
			.then((stream) => {
				let video = videoRef.current // this is the reason that getVideo has to defined inside the component ~Sahil
				video.srcObject = stream
				video.play()

				myPeer.on('call', (call) => {
					log('got a call.. yo!!')
					// this gets us the video of new user.
					call.answer(stream)

					// we send video to our newly connected user
					const video = document.createElement('video')
					call.on('stream', (userVideoStream) => {
						addVideoStream(video, userVideoStream)
					})
				})

				// attach socket event
				socket.on('user-connected', (userId) => {
					log('user connected:', userId)
					connectToNewUser(userId, stream)
				})
			})
			.catch((err) => {
				console.error('error:', err)
			})
	}

	return (
		<div className='App'>
			<h1>Hello, from my-fresh-app.</h1>
			{/* <div id='video-grid'></div> */}

			<div id='video-grid'> </div>

			<video ref={videoRef} className='player' />
			{/* <video onCanPlay={() => paintToCanvas()} ref={videoRef} className='player' />
			 */}
		</div>
	)
}

function connectToNewUser(userId, stream) {
	log('connectonewuser...')
	const call = myPeer.call(userId, stream)
	const video = document.createElement('video')
	call.on('stream', (userVideoStream) => {
		addVideoStream(video, userVideoStream)
	})
	call.on('close', () => {
		video.remove()
	})

	peers[userId] = call
}

// const ROOM_ID = 'a0a9832h0-aw0ho-i0032j' // should come from server via uuid generator
const ROOM_ID = window.location.pathname.slice(1) // should come from server via uuid generator
const id = 10 // userid

myPeer.on('open', (id) => {
	// this should send to server..
	socket.emit('join-room', ROOM_ID, id)
})

// we are ensuring that when any connected user leaves the room, the connection should be closed.
socket.on('user-disconnected', (userId) => {
	if (peers[userId]) peers[userId].close()
})

// # worked with fast-refresh-sideffect (...temp testing with react..)
function addVideoStream(video, stream) {
	video.srcObject = stream
	video.addEventListener('loadedmetadata', () => {
		video.play()
	})
	videoGrid.append(video)
}

export default App
