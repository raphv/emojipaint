#!/bin/sh

mkdir -p www/css
mkdir -p www/data
mkdir -p www/js

cp ../index.html www/index.html
cp ../css/emojipaint.css www/css/emojipaint.css
cp ../data/emojidata.json www/data/emojidata.json
cp ../js/emojipaint.js www/js/emojipaint.js
