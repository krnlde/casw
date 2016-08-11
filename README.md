# Clustered asynchronous streaming webserver (PoC)

This repository is my proof-of-concept for my very bachelor's thesis. It utilizes all available hardware cores und enables true, asynchronous streaming for all static files contained in `./www`. Meaning you can scrub through video and audio (even large text if you need to) without having to actually download the whole file.

## Prerequisits

A functioning node.js v6.3.1+ and the ability to start a webserver on port 8000 on the target machine.

## Install

1. Run `npm install`
2. Put some files in the `./www` folder
3. Run `node index.js`
4. Open your webbrowser and surf `http://localhost:8000/YOUR_FILE`
