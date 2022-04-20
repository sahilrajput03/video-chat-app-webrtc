# README

Project insights: Frontend is hosted at this same repository from `docs` folder from the `hash-router` branch.

```bash
# Simply use below scripts to push to github and heroku for frontend and backend deployments, yo!
./pushToGithubPages.sh
./pushToHeoku.sh 


# Using peer's cli way to setup a network is not required now coz I mounted peer on top of express server.
npm i peer

# USAGE:
peerjs --port 3001
```

Help refernce: [Kyle's Video chat app @ Youtube](https://youtu.be/DvlyzDZDEq4)


**Guide to publish a nested project folder serving to heroku:**

1. Buildpack: [@Github](https://github.com/timanovsky/subdir-heroku-buildpack) : Read its readme to SETUP SIMPLY like 1 2 3.

2. Source of above: https://stackoverflow.com/a/53221996/10012446
