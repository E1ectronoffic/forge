#!/bin/bash

NODE_INSTALLER="$1"

npm i -g yarn
npm i -g bolt@0.20.1

cd /code

bolt
bolt build
bolt lint

CI=true bolt ws test -- --installer=$NODE_INSTALLER
