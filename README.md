# HH Resume Bumper

HH Resume Bumper is a simple node console tool made for auto checking and bumping resumes on hh.ru.

## Setup config

Go to the **config** folder and edit **defaults.json** config in following way:

In `token` set your hhtoken from browser storage/cookies

In `resumeBumper.checkInterval` set desired resume check interval in MS (Higher is better but default value is fine)

In `resumeBumper.bumpInterval` set desired resume bump interval in MS, useful if you have multiple resumes

In `activityBoost.checkInterval` set desired vacancy view interval in MS, use this if you need to keep your activity score up to 100

### Multiple accounts

Now the config supports running multiple HH accounts in one process

Where each key is an account name (for example `default`, `default-2`)

## Install && Launch

```sh
yarn install
node main.js
```

A little advice: run program through **pm2** on VPS to forget about it and don't care about restarts on crash.

**Or just use included docker container. (docker-compose up -d)**

> Note: The program is made for fun, personal use, without any obligation and mandatory in further support
