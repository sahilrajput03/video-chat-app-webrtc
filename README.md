# README

**FIX THE BLACK SCREEN BUG WITH THIS:: `playsinline` coz omegle also has this for the `video` html tag as well i.e., **

Bug tracked @ apple support: https://developer.apple.com/forums/thread/690523

Another stackoverflow answer talking about this common issue to be solved using playsinline: https://stackoverflow.com/a/51432655/10012446

```
# src: https://css-tricks.com/what-does-playsinline-mean-in-web-video/
# mdn: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-playsinline

<video id="othervideo" autoplay="" playsinline="playsinline" webkit-playsinline="playsinline" style="width: 600px; height: 450px; top: 0px;"></video>
```

Brose Project @ [https://letsjoin.ml](https://letsjoin.ml)

Project insights: Frontend is hosted at this same repository from `docs` folder from the `hash-router` branch.

```bash
# Simply use below scripts to push to github and heroku for frontend and backend deployments, yo!
./pushToGithubPages.sh
./pushToHeoku.sh 
```

Help refernce: [Kyle's Video chat app @ Youtube](https://youtu.be/DvlyzDZDEq4)
[Kyle's Github Repo](https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)


#### Guide to publish a nested project folder serving to heroku:**

1. Buildpack: [@Github](https://github.com/timanovsky/subdir-heroku-buildpack) : Read its readme to SETUP SIMPLY like 1 2 3.

2. Source of above: https://stackoverflow.com/a/53221996/10012446

## TODO

- Add microphone functionality (URGENT)
- Add screenshare option to this app https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/47#issuecomment-1046939709)
- Check out PR's for code improvements or other suggestions (https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc).

## Old way of using peerjs (FYI:I am no longer using it this way)

```bash
# Using peer's cli way to setup a network is not required now coz I mounted peer on top of express server.
npm i peer

# USAGE:
peerjs --port 3001
```
