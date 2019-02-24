/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// A 32-bit texture.
Rngon.texture_rgba = function(data = {width: 0, height: 0, pixels: []})
{
    // The maximum dimensions of a texture.
    const maxWidth = 32768;
    const maxHeight = 32768;

    const numColorChannels = 4;

    Rngon.assert((Number.isInteger(data.width) && Number.isInteger(data.height)),
                 "Expected texture width and height to be integer values.");
    Rngon.assert((data.width > 0 && data.height > 0),
                 "Expected texture width and height to be greater than zero.")
    Rngon.assert((data.width <= maxWidth && data.height <= maxHeight),
                 "Expected texture width/height to be no more than " + maxWidth + "/" + maxHeight + ".");

    // If necessary, decode the pixel data into raw RGBA/8888.
    if (typeof data.encoding !== "undefined" && data.encoding !== "none")
    {
        // In Base64-encoded data, each pixel's RGBA is expected to be given as a 16-bit
        // value, where each of the RGB channels takes up 5 bits and the alpha channel
        // 1 bit.
        if (data.encoding === "base64")
        {
            Rngon.assert((data.channels === "rgba:5+5+5+1"), "Expected Base64-encoded data to be in RGBA 5551 format.");

            data.pixels = (()=>
            {
                const rgba = [];
                const decoded = atob(data.pixels);

                // We should have an array where each pixel is a 2-byte value.
                Rngon.assert(decoded.length === (data.width * data.height * 2), "Unexpected data length for a Base64-encoded texture.");

                for (let i = 0; i < (data.width * data.height * 2); i += 2)
                {
                    const p = (decoded.charCodeAt(i) | (decoded.charCodeAt(i+1)<<8));

                    rgba.push((p         & 0x1f) * 8);  // Red.
                    rgba.push(((p >> 5)  & 0x1f) * 8);  // Green.
                    rgba.push(((p >> 10) & 0x1f) * 8);  // Blue.
                    rgba.push(((p >> 15) & 1) * 255);   // Alpha.
                }

                return rgba;
            })();
        }
        else if (data.encoding !== "none")
        {
            Rngon.assert(0, "Unknown texture data encoding '" + data.encoding + "'.");
        }
    }

    Rngon.assert((data.pixels.length === (data.width * data.height * numColorChannels)),
                 "The texture's pixel array size doesn't match its width and height.");
        
    const publicInterface = Object.freeze(
    {
        width: data.width,
        height: data.height,
        
        // Returns an unfrozen 4-element array containing copies of the texture's RGBA values
        // at the given x,y texel coordinates.
        rgba_channels_at: function(x, y)
        {
            const idx = ((Math.floor(x) + Math.floor(y) * data.width) * numColorChannels);
            Rngon.assert(((idx + numColorChannels) <= data.pixels.length), "Attempting to access a texture pixel out of bounds.");

            // Note: For performance reasons, the array isn't returned frozen. You can try freezing it
            // and running a perf test with textured rendering to see the effect.
            return [data.pixels[idx + 0],
                    data.pixels[idx + 1],
                    data.pixels[idx + 2],
                    data.pixels[idx + 3]];
        }
    });
    return publicInterface;
}

// Returns a Promise of a texture whose data is loaded from the given file. The actual
// texture is returned once the data has been loaded.
// Note: Only supports JSON files at the moment, expecting them to contain a valid
// object to be passed as-is into texture_rgba().
Rngon.texture_rgba.create_with_data_from_file = function(filename)
{
    return new Promise((resolve, reject)=>
    {
        fetch(filename)
        .then((response)=>response.json())
        .then((data)=>
        {
            resolve(Rngon.texture_rgba(data));
        })
        .catch((error)=>{Rngon.assert(0, "Failed to create a texture with data from file '" + filename + "'. Error: '" + error + "'.")});
    });
}
