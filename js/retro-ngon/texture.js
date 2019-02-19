/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// A 32-bit texture. Its pixels are an array of consecutive r,g,b,a values (range 0..255)
// repeated width*height times (e.g. [0,255,0,255, 255,0,0,255] for two pixels, green and red).
// Note that an alpha of 255 means fully opaque, and an alpha of !255 means fully transparent.
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
    Rngon.assert((data.pixels instanceof Array),
                 "Expected an array of pixel color values.");
    Rngon.assert((data.pixels.length === (data.width * data.height * numColorChannels)),
                 "The given pixel array's size doesn't match the given width and height.");
    
    const publicInterface = Object.freeze(
    {
        width: data.width,
        height: data.height,
        
        // Returns an unfrozen 4-element array containing copies of the texture's RGBA values
        // at the given x,y texel coordinates.
        rgba_channels_at: function(x, y)
        {
            const idx = ((Math.floor(x) + Math.floor(y) * data.width) * numColorChannels);
            Rngon.assert(((idx + numColorChannels) <= data.pixels.length),
                         "Attempting to access a texture pixel out of bounds.");

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
