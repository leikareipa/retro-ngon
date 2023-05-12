/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
import {assert as Assert} from "../core/util.js";
import {$throw as Throw} from "../core/util.js";

const maxTextureWidth = 32768;
const maxTextureHeight = 32768;
const numColorChannels = 4;

// Texture with 32-bit color.
export function texture(data = {})
{
    // Append default arguments.
    data = {
        width: 0,
        height: 0,
        pixels: [],
        encoding: "none",
        channels: "rgba:8+8+8+8",
        ...data,
    };

    validate_object?.(data, texture.schema.arguments);

    decode_pixel_data(data);

    const publicInterface = {
        $constructor: "Texture",
        mipLevels: generate_mipmaps(data),
        ...data,
    };

    validate_object?.(publicInterface, texture.schema.interface);
    
    return publicInterface;
}

texture.schema = {
    arguments: {
        where: "in arguments passed to texture()",
        allowAdditionalProperties: true,
        properties: {
            "pixels": [["number"], "string"],
            "width": {
                type: ["number"],
                value(width) {
                    if ((width < 1) || (width >= maxTextureWidth)) {
                        return `Texture width must be in the range [1, ${maxTextureWidth - 1}]`
                    }
                },
            },
            "height": {
                type: ["number"],
                value(height) {
                    if ((height < 1) || (height >= maxTextureHeight)) {
                        return `Texture height must be in the range [1, ${maxTextureHeight - 1}]`
                    }
                },
            },
            "encoding": {
                type: ["string"],
                value(encoding) {
                    const supported = [
                        "none",
                        "base64",
                    ];
                    if (!supported.includes(encoding)) {
                        return `Texture encoding must be one of ${supported.join(", ")}`;
                    }
                },
            },
            "channels": {
                type: ["string"],
                value(channels) {
                    const supported = [
                        "rgba:5+5+5+1",
                        "rgba:8+8+8+8",
                    ];
                    if (!supported.includes(channels)) {
                        return `Texture pixel layout must be one of ${supported.join(", ")}`;
                    }
                },
            }
        },
    },
    interface: {
        where: "in the return value of texture()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Texture",
            },
            "width": ["number"],
            "height": ["number"],
            "pixels": ["Uint8ClampedArray"],
            "mipLevels": [["object"]],
        },
    },
};

// Returns a new texture whose pixel data are a deep copy of the given texture.
texture.deep_copy = function(srcTexture)
{
    const copiedPixels = new Array(srcTexture.width * srcTexture.height * 4);

    for (let i = 0; i< (srcTexture.width * srcTexture.height * 4); i++)
    {
        copiedPixels[i] = srcTexture.pixels[i];
    }

    return texture({
        ...srcTexture,
        pixels: copiedPixels,
    });
}

// Returns a Promise of a texture whose data is loaded from the given file. The actual
// texture is returned once the data has been loaded.
//
// NOTE: Only supports JSON files at the moment, expecting them to contain a valid
// object to be passed as-is into texture().
texture.load = function(filename)
{
    return new Promise((resolve, reject)=>
    {
        fetch(filename)
        .then((response)=>response.json())
        .then((data)=>
        {
            resolve(texture(data));
        })
        .catch((error)=>{
            Throw(`Failed to create a texture with data from file '${filename}'. Error: '${error}'.`)
        });
    });
}

// Decodes the pixel data passed to Rngon.texture() into a Uint8ClampedArray that stores
// consecutive RGBA pixel color values.
function decode_pixel_data(data)
{
    if (data.encoding === "none")
    {
        if (!(data.pixels instanceof Uint8ClampedArray))
        {
            data.pixels = new Uint8ClampedArray(data.pixels);
        }
    }
    else
    {
        // In Base64-encoded data, each pixel's RGBA is expected to be given as a 16-bit
        // value, where each of the RGB channels takes up 5 bits and the alpha channel
        // 1 bit.
        if (data.encoding === "base64")
        {
            const decoded = atob(data.pixels);
            data.pixels = new Uint8ClampedArray(data.width * data.height * numColorChannels);

            switch (data.channels)
            {
                case "rgba:8+8+8+8":
                {
                    Assert?.(
                        (decoded.length === (data.width * data.height * numColorChannels)),
                        "Unexpected data length for a Base64-encoded texture; expected 4 bytes per pixel."
                    );

                    for (let i = 0; i < (data.width * data.height * 4); i++)
                    {
                        data.pixels[i] = decoded.charCodeAt(i);
                    }

                    break;
                }
                case "rgba:5+5+5+1":
                {
                    Assert?.(
                        (decoded.length === (data.width * data.height * 2)),
                        "Unexpected data length for a Base64-encoded texture; expected 2 bytes per pixel."
                    );

                    let i2 = 0;
                    for (let i = 0; i < (data.width * data.height * 2); i += 2)
                    {
                        const p = (decoded.charCodeAt(i) + (decoded.charCodeAt(i + 1) << 8));
                        data.pixels[i2++] = (( p        & 0x1f) * 8);  // Red.
                        data.pixels[i2++] = (((p >> 5)  & 0x1f) * 8);  // Green.
                        data.pixels[i2++] = (((p >> 10) & 0x1f) * 8);  // Blue.
                        data.pixels[i2++] = (((p >> 15) & 1) * 255);   // Alpha.
                    }

                    break;
                }
                default: Throw("Unrecognized value for texture 'channels' attribute."); break;
            }
        }
        else if (data.encoding !== "none")
        {
            Throw("Unknown texture data encoding '" + data.encoding + "'.");
        }
    }

    Assert?.(
        (data.pixels.length === (data.width * data.height * numColorChannels)),
        "The texture's pixel array size doesn't match its width and height."
    );
}

// Generates mipmaps from the pixel data passed to Rngon.texture().
// 
// Each successive mipmap is one half of the previous mipmap's width and height, starting
// from the full resolution and working down to 1 x 1. So mipmaps[0] is the original
// full-resolution texture, and mipmaps[mipmaps.length-1] is the smallest, 1 x 1 texture.
function generate_mipmaps(data)
{
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
                    const dstIdx = ((x + y * mipWidth) * numColorChannels);
                    const srcIdx = ((Math.floor(x * deltaW) + Math.floor(y * deltaH) * data.width) * numColorChannels);

                    for (let c = 0; c < numColorChannels; c++)
                    {
                        mipPixelData[dstIdx + c] = data.pixels[srcIdx + c];
                    }
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
            Assert?.(
                (mipmaps.length > 0),
                "Failed to generate mip levels for a texture."
            );

            break;
        }
    }

    return mipmaps;
}
