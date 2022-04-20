#!/bin/bash
cd frontend
npm run build
git add -A; git commit -m "update"; git push
