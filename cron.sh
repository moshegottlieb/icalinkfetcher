#!/usr/bin/env bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if [ -f output.png ]; then
	mv output.png output.png.bak
fi
node dist/src/index.js
if [ -f output.png.bak ]; then
	diff output.png output.png.bak && exit 0 # Do not refresh if there's no need to
fi
convert output.png -rotate 90 -monochrome out.bmp
epd out.bmp
rm -f out.bmp
