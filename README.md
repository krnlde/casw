# Clustered asynchronous streaming webserver (PoC)

This repository is my proof-of-concept for my very bachelor's thesis. It utilizes all your available hardware cores by forking new processes accordingly und enables true asynchronous streaming for all static files contained in `./www`. Meaning you can scrub through video and audio (all binaries and even large texts if you need to) without having to actually download the whole file.

Oh yeah, and all that in under 100 SLOC.

## Prerequisits

A functioning node.js v6.3.1+ and the ability to start a webserver on port 8000 on the target machine.

## Install

1. Run `npm install`
2. Put some files in the `./www` folder
3. Run `node index.js`
4. Open your webbrowser and surf `http://localhost:8000/YOUR_FILE`

## Improvements

1. Cache files (via a shared-cache for all processes) with a certain lifetime so you don't need to access the fs everytime
2. Failsafe to respawn killed processes
3. Zero-downtime re-deployment (probably better done with PM2)
