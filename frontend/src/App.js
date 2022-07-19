import {HashRouter, Route, Routes, Link, useNavigate} from 'react-router-dom'
import {io} from 'socket.io-client' // docs https://socket.io/docs/v4/client-api/
import {useEffect, useRef} from 'react'
import Peer from 'peerjs' // docs https://www.npmjs.com/package/peerjs
import './App.css'
let log = console.log

/**
 * Important seeming issue and PRs
 * 1. https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/21#issuecomment-692056271
 * 2. https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/14
 * 3. https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/pull/39/files
 * 4. https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/pull/65/files
 *
 * ALL PRS: https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/pulls
 */

// let HOST = '192.168.18.3' // local
// let HOST = '49.156.97.84' // public
let HOST = 'video-app-backend.herokuapp.com' // public
let socket
// const socket = io('/') // from kyle

// let isHeroku = false
let PORT = 8080 // HELPFUL FOR LOCAL TESTING AND ON PUBLIC IP TESTING.
if (HOST.includes('herokuapp.com')) {
	PORT = 80
	// isHeroku = true

	socket = io(`wss://${HOST}/`) // this is passed to client to make future requests at.
	// NOTE THE wss  ^^^^^ change above, that was critically necessary to make requests work in broser with the backend for webrtc.
	// ^^^^ All this works locally and on github pages very well.
} else {
	// socket = io('ws://localhost:8080/')
	socket = io(`ws://${HOST}:${PORT}/`) // this is passed to client to make future requests at.
}
// BROWSE APP: http://124.253.36.113:3000/room1

// FROM peerjs docs: undefined => pick-an-id
// undefined coz we wan't peerjs to create ids for us.
const myPeer = new Peer(undefined, {
	// host: '/', // from kyle
	host: HOST,
	secure: true, // to fix ``RR_SSL_PROTOCOL_ERROR`` from peerjs endpoint.
	// port: 3001, // I was using 300 port with peerjs cli usage i.e., `peerjs --port 3001`

	// port: 8080, // NOW I AM USING peerjs mounted on expresjs itself! Yikes! IT WORKS!
	// TEST => SUCCESSFUL: DONT use port at all for heroku app deployment for `letsjoin.ml`.
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
// const FRAME_RATE = 100
function App() {
	return (
		<div className='App'>
			<h1 className='title'>Mooz</h1>

			<HashRouter basename='/'>
				<Link to='/' className='btn btn-home'>
					Home
				</Link>
				{/* ^^ this does't redirect to home sometimes. yucky!!*/}
				<Link to='/room/room1' className='btn'>
					Go to Room 1
				</Link>
				{/* <li> <Link to='/room/room2'>Go to Room 2</Link> </li> */}
				<hr />
				{/*<Route exact path='/' component={Home} /> */}
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/room/:roomId' element={<Room />} />
				</Routes>
			</HashRouter>
		</div>
	)
}

const Home = () => {
	return <div className='hero-text'>Home page contents</div>
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
let _stream
const Room = (props) => {
	const videoRef = useRef(null)
	let navigate = useNavigate()

	log('props in room:', {props})
	log('rendered room comp..')

	useEffect(() => {
		videoGrid = document.getElementById('video-container')
		// Join a room ~Sahil
		log('ROOM MOUNT: ')

		// (work real good!)MANUALLY CONNECTING TO SOCKET IS REQUIRED COZ I AM DISCONNECTING FROM SOCKET ON ROOM COMPONENT DISMOUNT, so remounting the component would require to reconnect to socket.
		socket.connect()

		// we are ensuring that when any connected user leaves the room, the connection should be closed.
		socket.on('user-disconnected', (userId) => {
			// alert('EVENT::user-disconnected')
			log('->>EVENT: user-disconnected')
			if (peers[userId]) {
				peers[userId].close()
				peers[userId] = false
				log('GOOD DAY CLOSING SUCCESSFUL USING ID!!')
			} else {
				log(':( BAD DAY CLOSING SUCCESSFUL without USING ID!!')
			}
		})

		return () => {
			log('ROOM UNMOUNTED: ')
			log('SOCKET DICONNECTED')
			socket.disconnect()

			//(::WORK WELL!::) this is to remove old event hadnler which we bind so we need to remove them so that if later the user connects to other room or same room, he won't get previous handlers called. src: https://github.com/peers/peerjs/issues/331#issuecomment-477572101
			// @ts-ignore
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
		// alert('getVideo ::FUNCTION CALLED::')
		navigator.mediaDevices
			.getUserMedia({
				// for safari: https://github.com/webrtc/samples/issues/1218
				//
				// try official webrtc video samples from: https://webrtc.github.io/samples/
				//^^ Go to `record` sample, src: https://github.com/webrtc/samples/issues/1218#issuecomment-596140895
				// TLDR: echoCancellation is not supported.
				//
				video: {width: 320}, // and height will be 240 according to 4:3 ration.
				// video: true,
				// audio: {
				// 	sampleSize: 8,
					// echoCancellation: true, // read above comments coz echoCancellatin is diabled for safari most probably.
				// },
				audio: true
			})
			.then((stream) => {
				window.stream = _stream = stream // bcoz we would need to close webcam and mic access manually on disconnect button event or navigating to home component directy from the Room component.
				// alert('got stream')
				let video = videoRef.current // this is the reason that getVideo has to defined inside the component ~Sahil
				video.muted = true
				video.srcObject = stream
				video.play()

				log(`REGISTER CALL RECEIVING HANDLER!`)
				myPeer.on('call', (call) => {
					if (peers[call.peer]) {
						alert('PREVENTED DUPLICATE CALL ADDITION')
						// alert('PREVENTED DUPLICATE')
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
						log('RECEIVING CALL NOWWWW')
						// alert('ADD VIDEO STREAM')
						addVideoStream(video, userVideoStream)
					})

					call.on('close', () => {
						log('::::CLOSE:::HANDLE:::CALLED:: will remove the video element.')
						video.remove()
						delete peers[call.peer]
					})
					// @ts-ignore
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
							// alert('EVENT::user-connected')

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
						setTimeout(joinRoomRecursive, 1000)
					}
				}
				joinRoomRecursive()
			})
			.catch((err) => {
				console.error('error:', err)
			})
	}

	const exitVideoCall = () => {
		// alert('ROOM COMPONENT UNMOUNTED')
		socket.disconnect()

		// On Room component unmount simply revoke the webcam and mic access. // src: https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
		_stream.getTracks().forEach(function (track) {
			track.stop()
		})
	}

	// This is for component unmount event.
	useEffect(() => {
		return exitVideoCall
	}, [])

	/**
	 * This is for tab close event (coz when in a video call if one user closes tab then video get struck for few seconds.)
		So to fix that I was trying to use a tab close event so on mobile tab close event I can disconnect from video call via `exitVideoCall()`.
		But it seems mobile browsers don't support firing such events :( SAD
		Src: https://stackoverflow.com/a/28450204/10012446
		SO COMMENTING BELOW CODE.
		
	useEffect(() => {
		const onCloseTabCallback = (e) => {
			alert('boo?')
			log('boo')
			// Closing
			exitVideoCall()

			// Necessary setup to make this callack work, src: https://bobbyhadz.com/blog/react-handle-tab-close-event
			e.preventDefault()
			e.returnValue = '' // this value has to be other than null and undefined.
			log('boo')
		}

		window.addEventListener('beforeunload', onCloseTabCallback)

		return () => window.removeEventListener('beforeunload', onCloseTabCallback)
	})
	 */

	// FYI: Login of compoonent unmount will take care how we execute the disconnection and navigation to Home component nicely.
	const disconnect = () => {
		navigate('/')
	}
	return (
		<>
			<div id='video-container'>
				<video ref={videoRef} />
			</div>
			<button className='btn-disconnect' onClick={disconnect}>
				Disconnect
			</button>

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
// const id = 10 // userId
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
