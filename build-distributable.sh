#!/bin/bash

# Concatenates the retro n-gon renderer's source files into a single distributable file.

DIRECTORY="./distributable/"
FILENAME="rngon.cat.js"
VERSION="beta live"

SOURCE_FILES=("./js/retro-ngon/retro-ngon.js"
              "./js/retro-ngon/trig.js"
              "./js/retro-ngon/color.js"
              "./js/retro-ngon/geometry.js"
              "./js/retro-ngon/line-draw.js"
              "./js/retro-ngon/matrix44.js"
              "./js/retro-ngon/ngon-fill.js"
              "./js/retro-ngon/render.js"
              "./js/retro-ngon/transform.js"
              "./js/retro-ngon/texture.js"
              "./js/retro-ngon/screen.js")

echo "// WHAT: Concatenated JavaScript source files" > "$DIRECTORY/$FILENAME"
echo "// PROGRAM: Retro n-gon renderer" >> "$DIRECTORY/$FILENAME"
echo "// VERSION: $VERSION (`LC_ALL=en_US.utf8 date -u +"%d %B %Y %H:%M:%S %Z"`)" >> "$DIRECTORY/$FILENAME"
echo "// AUTHOR: Tarpeeksi Hyvae Soft and others" >> "$DIRECTORY/$FILENAME"
echo "// LINK: https://www.github.com/leikareipa/retro-ngon/" >> "$DIRECTORY/$FILENAME"
echo "// FILES:" >> "$DIRECTORY/$FILENAME"
printf "//\t%s\n" "${SOURCE_FILES[@]}" >> "$DIRECTORY/$FILENAME"
echo -e "/////////////////////////////////////////////////\n" >> "$DIRECTORY/$FILENAME"

cat ${SOURCE_FILES[@]} >> "$DIRECTORY/$FILENAME"
