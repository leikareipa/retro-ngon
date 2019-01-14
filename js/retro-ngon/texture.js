/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict"

// A 24-bit texture. Its pixels are an array of consecutive r,g,b values (range 0..255)
// repeated width*height times (e.g. [0,255,0, 255,0,0] for two pixels, green and red).
Rngon.rgb_texture = function(data = {width: 0, height: 0, pixels: []})
{
    // The maximum dimensions of a texture.
    const maxWidth = 32768;
    const maxHeight = 32768;

    // Three channels, RGB.
    const numColorChannels = 3;

    k_assert((typeof data.width === "number" && typeof data.height === "number"), "Expected texture width and height to be numbers.");
    k_assert((data.width > 0 && data.height > 0), "Expected texture width and height to be greater than zero.")
    k_assert((data.width <= maxWidth && data.height <= maxHeight), "Expected texture width/height to be no more than " + maxWidth + "/" + maxHeight + ".");

    k_assert((data.pixels instanceof Array), "Expected an array of pixel color values.");
    k_assert((data.pixels.length > 0), "Detected a request for a texture with no pixels.");
    k_assert(((data.pixels.length % 3) === 0), "Expected texture pixel data to be RGB.");
    k_assert((data.pixels.length === (data.width * data.height * numColorChannels)), "The given pixel array's size doesn't match the given width and height.");
    
    const publicInterface = Object.freeze(
    {
        width: data.width,
        height: data.height,
        
        rgba_pixel_at: function(x, y)
        {
            k_assert((numColorChannels === 3), "Expected three color channels for RGB.");

            const idx = Math.floor((x + y * data.width) * numColorChannels);
            k_assert(((idx + 3) <= data.pixels.length), "Attempting to access a texture pixel out of bounds.");

            return Rngon.color_rgba(data.pixels[idx],
                                    data.pixels[idx + 1],
                                    data.pixels[idx + 2],
                                    255);
        }
    });
    return publicInterface;
}
