import {HashRouter, Route, Routes, Link, useNavigate} from 'react-router-dom'
import {io} from 'socket.io-client' // docs https://socket.io/docs/v4/client-api/
import {useState, useEffect, useRef} from 'react'
import Peer from 'peerjs' // docs https://www.npmjs.com/package/peerjs
import './App.css'
let log = console.log

// let HOST = '192.168.18.3' // local
let HOST = '49.156.97.84' // public
// BROWSE APP: http://124.253.36.113:3000/room1

// const socket = io('ws://localhost:8080/')
const socket = io(`ws://${HOST}:8080/`) // this is passed to client to make future requests at.
// const socket = io('/') // from kyle

// FROM peerjs docs: undefined => pick-an-id
// undefined coz we wan't peerjs to create ids for us.
const myPeer = new Peer(undefined, {
	// host: '/', // from kyle
	host: HOST,
	port: 3001,
})
let peers = {}

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
	return (
		<div className='App'>
			<h1>Vide chat app</h1>

			<HashRouter basename='/'>
				<ul>
					<li>
						<Link to='/'>Home</Link>
						{/* ^^ this does't redirect to home sometimes. yucky!!*/}
					</li>
					<li>
						<Link to='/room/room1'>Go to Room 1</Link>
					</li>
					<li>
						<Link to='/room/room2'>Go to Room 2</Link>
					</li>
				</ul>
				<hr />
				{/*<Route exact path='/' component={Home} /> */}
				<Routes>
					<Route path='/' element={<div>Home page contents</div>} />
					<Route path='/room/:roomId' element={<Room />} />
				</Routes>
			</HashRouter>
		</div>
	)
}

let userId

// The connection is opened at the time of page launch automatically and managed on its own. And you should register the below handler on the conneciton open event at top level only.
// BCOZ: I tried to put below hander in Room component mount and it resulted in never calling of this handler then.
myPeer.on('open', (id) => {
	// this should send to server..
	// socket.emit('join-room', ROOM_ID, id) // i would join a room only when room component is mounted..
	userId = id
	log('::open::callback::peerjs::got userId peerjs:', userId)
})

let currentCall
const Room = () => {
	log('rendered room comp..')
	const videoRef = useRef(null)

	useEffect(() => {
		videoGrid = document.getElementById('video-grid')
		// Join a room ~Sahil
		log('ROOM MOUNT: ')

		// (work real good!)MANUALLY CONNECTING TO SOCKET IS REQUIRED COZ I AM DISCONNECTING FROM SOCKET ON ROOM COMPONENT DISMOUNT, so remounting the component would require to reconnect to socket.
		socket.connect()

		// we are ensuring that when any connected user leaves the room, the connection should be closed.
		socket.on('user-disconnected', (userId) => {
			log('->>EVENT: user-disconnected')
			if (peers[userId]) {
				peers[userId].close()
				peers[userId] = false
				log('GOOD DAY CLOSING SUCCESSFUL USING ID!!')
			}
			{
				log(':( BAD DAY CLOSING SUCCESSFUL without USING ID!!')
			}
		})

		return () => {
			log('ROOM UNMOUNTED: ')
			log('SOCKET DICONNECTED')
			socket.disconnect()

			//(::WORK WELL!::) this is to remove old event hadnler which we bind so we need to remove them so that if later the user connects to other room or same room, he won't get previous handlers called. src: https://github.com/peers/peerjs/issues/331#issuecomment-477572101
			myPeer.off('call')
			// myPeer.off('stream') // this is not checked though.
			peers = {}
		}
	}, [])

	useEffect(() => {
		getVideo()

		log('effect..')
		return () => {
			log('effect unmounted!!')

			// TODO
			// call.off('stream')
			// currentCall.off('stream')
			log('currentCall', currentCall)
		}
	}, [videoRef])

	const getVideo = () => {
		navigator.mediaDevices
			.getUserMedia({video: {width: 300}})
			.then((stream) => {
				let video = videoRef.current // this is the reason that getVideo has to defined inside the component ~Sahil
				video.srcObject = stream
				video.play()

				log(`REGISTER CALL RECEIVING HANDLER!`)
				myPeer.on('call', (call) => {
					if (peers[call.peer]) {
						// i.e., if we get multiple request for a single user then we don't care for newer calls, fixes the multiple other person joined calles to be fixed.
						log('1. prevented duplicate call addition of already existing user..')
						return
					}

					// assign all calls to peers object so we can cancel calls at the time undoing side effects on component unmount.
					// peer is the peer id
					peers[call.peer] = call

					log('got a call.. yo!!')
					// this gets us the video of new user.
					call.answer(stream)

					// we send video to our newly connected user
					const video = document.createElement('video')
					call.on('stream', (userVideoStream) => {
						addVideoStream(video, userVideoStream)
					})

					call.on('close', () => {
						log('::::CLOSE:::HANDLE:::CALLED:: will remove the video element.')
						video.remove()
					})
					window.currentCall = call // assigning so we can clear the handler on component unmount.
				})

				const joinRoomRecursive = () => {
					log('::>>::inside joinRoom function:')
					if (userId) {
						log('::ROOM CREATE:: (userId peerjs):', userId)
						socket.emit('join-room', ROOM_ID, userId)

						// register USER-CONNECTED socket event handler..
						log('REGISTERED USER-CONNECTED HANDLER..')
						socket.on('user-connected', (userId) => {
							log('user connected:', userId)

							if (peers[userId]) {
								// i.e., if we get multiple request for a single user then we don't care for newer calls, fixes the multiple other person joined calles to be fixed.
								log('2. prevented duplicate call addition of already existing user..')
								// SO WE WILL NOT CONNECT TO A USER WITH EXISTING PEERID.
								return
							}

							connectToNewUser(userId, stream)
						})
					} else {
						log('calling joinRoom again..')
						setTimeout(1000, joinRoomRecursive)
					}
				}
				joinRoomRecursive()
			})
			.catch((err) => {
				console.error('error:', err)
			})
	}

	return (
		<>
			<div id='video-grid'> </div>
			<video ref={videoRef} className='player' />
			Me (^^^)
			<button
				onClick={() => {
					socket.disconnect()
				}}
				children='Manual Disconnect socket'
			/>
			{/* <video onCanPlay={() => paintToCanvas()} ref={videoRef} className='player' />
			 */}
		</>
	)
}

// socket.on('user-connected', (userId) => {
// 	log(' TETSING:USER CONNECTED: EVENT:')
// })

function connectToNewUser(userId, stream) {
	log('::f::connectToNewUser function called..')

	log(`called mypeer.call 2`)
	const call = myPeer.call(userId, stream)
	const video = document.createElement('video')
	call.on('stream', (userVideoStream) => {
		addVideoStream(video, userVideoStream)
	})
	call.on('close', () => {
		log('::::CLOSE:::HANDLE:::CALLED:: will remove the video element.')
		video.remove()
	})

	peers[userId] = call
	log('BALLE BALLE: new peers assigned:', userId)
}

// const ROOM_ID = 'a0a9832h0-aw0ho-i0032j' // should come from server via uuid generator
// const ROOM_ID = window.location.pathname.slice(1) // should come from server via uuid generator
const ROOM_ID = 'room1'
const id = 10 // userId
//
// # worked with fast-refresh-sideffect (...temp testing with react..)
function addVideoStream(video, stream) {
	video.srcObject = stream
	video.addEventListener('loadedmetadata', () => {
		video.play()
	})
	videoGrid.append(video)
}

export default App
