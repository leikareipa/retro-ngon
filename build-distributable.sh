#!/bin/bash

# Concatenates the retro n-gon renderer's source files into a single distributable file.

DIRECTORY="./distributable/"
FILENAME="rngon.cat.js"
VERSION="beta live"

SOURCE_FILES=("./js/retro-ngon/retro-ngon.js"
              "./js/retro-ngon/core/util.js"
              "./js/retro-ngon/core/internal-state.js"
              "./js/retro-ngon/core/trig.js"
              "./js/retro-ngon/core/light.js"
              "./js/retro-ngon/core/color.js"
              "./js/retro-ngon/core/vector3.js"
              "./js/retro-ngon/core/vertex.js"
              "./js/retro-ngon/core/mesh.js"
              "./js/retro-ngon/core/ngon.js"
              "./js/retro-ngon/core/matrix44.js"
              "./js/retro-ngon/base-modules/rasterize.js"
              "./js/retro-ngon/base-modules/transform-clip-light.js"
              "./js/retro-ngon/base-modules/surface-wipe.js"
              "./js/retro-ngon/api/render.js"
              "./js/retro-ngon/api/render-async.js"
              "./js/retro-ngon/core/render-shared.js"
              "./js/retro-ngon/core/texture.js"
              "./js/retro-ngon/core/surface.js")

echo "// WHAT: Concatenated JavaScript source files" > "$DIRECTORY/$FILENAME"
echo "// PROGRAM: Retro n-gon renderer" >> "$DIRECTORY/$FILENAME"
echo "// VERSION: $VERSION (`LC_ALL=en_US.utf8 date -u +"%d %B %Y %H:%M:%S %Z"`)" >> "$DIRECTORY/$FILENAME"
echo "// AUTHOR: Tarpeeksi Hyvae Soft and others" >> "$DIRECTORY/$FILENAME"
echo "// LINK: https://www.github.com/leikareipa/retro-ngon/" >> "$DIRECTORY/$FILENAME"
echo "// FILES:" >> "$DIRECTORY/$FILENAME"
printf "//\t%s\n" "${SOURCE_FILES[@]}" >> "$DIRECTORY/$FILENAME"
echo -e "/////////////////////////////////////////////////\n" >> "$DIRECTORY/$FILENAME"

cat ${SOURCE_FILES[@]} >> "$DIRECTORY/$FILENAME"
