/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

// A 32-bit texture.
export function texture_rgba(data = {})
{
    // Append default parameter arguments.
    data = {
        ...{
            width: 0,
            height: 0,
            pixels: [],
            encoding: "none",
            channels: "rgba:8+8+8+8",
            needsFlip: true,
        },
        ...data,
    }

    // The maximum dimensions of a texture.
    const maxWidth = 32768;
    const maxHeight = 32768;

    const numColorChannels = 4;

    Rngon.assert?.(
        (Number.isInteger(data.width) && Number.isInteger(data.height)),
        "Expected texture width and height to be integer values."
    );
    
    Rngon.assert?.(
        ((data.width >= 0) && (data.height >= 0)),
        "Expected texture width and height to be no less than zero."
    );

    Rngon.assert?.(
        ((data.width <= maxWidth) && (data.height <= maxHeight)),
        `Expected texture width/height to be no more than ${maxWidth}/${maxHeight}.`
    );

    // If necessary, decode the pixel data into raw RGBA/8888.
    if (data.encoding !== "none")
    {
        // In Base64-encoded data, each pixel's RGBA is expected to be given as a 16-bit
        // value, where each of the RGB channels takes up 5 bits and the alpha channel
        // 1 bit.
        if (data.encoding === "base64")
        {
            Rngon.assert?.(
                (data.channels === "rgba:5+5+5+1"),
                "Expected Base64-encoded data to be in RGBA 5551 format."
            );

            data.pixels = (()=>
            {
                const rgba = [];
                const decoded = atob(data.pixels);

                // We should have an array where each pixel is a 2-byte value.
                Rngon.assert?.(
                    (decoded.length === (data.width * data.height * 2)),
                    "Unexpected data length for a Base64-encoded texture."
                );

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
            Rngon.$throw("Unknown texture data encoding '" + data.encoding + "'.");
        }
    }

    Rngon.assert?.(
        (data.pixels.length === (data.width * data.height * numColorChannels)),
        "The texture's pixel array size doesn't match its width and height."
    );

    // Convert the raw pixel data into objects of the form {red, green, blue, alpha}.
    // Note: We also flip the texture on the Y axis, to counter the fact that textures
    // become flipped on Y during rendering (i.e. we pre-emptively un-flip it, here).
    const pixelArray = [];
    for (let y = 0; y < data.height; y++)
    {
        for (let x = 0; x < data.width; x++)
        {
            const idx = ((x + (data.needsFlip? (data.height - y - 1) : y) * data.width) * numColorChannels);

            pixelArray.push({red:   data.pixels[idx + 0],
                             green: data.pixels[idx + 1],
                             blue:  data.pixels[idx + 2],
                             alpha: data.pixels[idx + 3]});
        }
    }

    // Generate mipmaps. Each successive mipmap is one half of the previous
    // mipmap's width and height, starting from the full resolution and working
    // down to 1 x 1. So mipmaps[0] is the original, full-resolution texture,
    // and mipmaps[mipmaps.length-1] is the smallest, 1 x 1 texture.
    const mipmaps = [];
    for (let m = 0; ; m++)
    {
        const mipWidth = Math.max(1, Math.floor(data.width / Math.pow(2, m)));
        const mipHeight = Math.max(1, Math.floor(data.height / Math.pow(2, m)));

        // Downscale the texture image to the next mip level.
        const mipPixelData = [];
        {
            const deltaW = (data.width / mipWidth);
            const deltaH = (data.height / mipHeight);
    
            for (let y = 0; y < mipHeight; y++)
            {
                for (let x = 0; x < mipWidth; x++)
                {
                    const dstIdx = (x + y * mipWidth);
                    const srcIdx = (Math.floor(x * deltaW) + Math.floor(y * deltaH) * data.width);

                    mipPixelData[dstIdx] = pixelArray[srcIdx];
                }
            }
        }

        mipmaps.push({
            width: mipWidth,
            height: mipHeight,
            pixels: mipPixelData,
        });

        // We're finished generating mip levels once we've done them down to 1 x 1.
        if ((mipWidth === 1) && (mipHeight === 1))
        {
            Rngon.assert?.(
                (mipmaps.length > 0),
                "Failed to generate mip levels for a texture."
            );

            break;
        }
    }

    const publicInterface = {
        ...data,
        pixels: pixelArray,
        mipLevels: mipmaps,
    };
    
    return publicInterface;
}


// Returns a new texture whose pixel data are a deep copy of the given texture.
texture_rgba.deep_copy = function(texture)
{
    const copiedPixels = new Array(texture.width * texture.height * 4);

    for (let i = 0; i< (texture.width * texture.height); i++)
    {
        copiedPixels[i*4+0] = texture.pixels[i].red;
        copiedPixels[i*4+1] = texture.pixels[i].green;
        copiedPixels[i*4+2] = texture.pixels[i].blue;
        copiedPixels[i*4+3] = texture.pixels[i].alpha;
    }

    return Rngon.texture_rgba({
        ...texture,
        pixels: copiedPixels,
    });
}

// Returns a Promise of a texture whose data is loaded from the given file. The actual
// texture is returned once the data has been loaded.
//
// NOTE: Only supports JSON files at the moment, expecting them to contain a valid
// object to be passed as-is into texture_rgba().
texture_rgba.create_with_data_from_file = function(filename)
{
    return new Promise((resolve, reject)=>
    {
        fetch(filename)
        .then((response)=>response.json())
        .then((data)=>
        {
            resolve(Rngon.texture_rgba(data));
        })
        .catch((error)=>{
            Rngon.$throw(`Failed to create a texture with data from file '${filename}'. Error: '${error}'.`)
        });
    });
}
