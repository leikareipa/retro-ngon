/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";
import {Assert} from "../assert.mjs";

const maxTextureWidth = 32768;
const maxTextureHeight = 32768;
const numColorChannels = 4;

export const textureDefaultData = {
    width: 1,
    height: 1,
    pixels: undefined,
    encoding: "none",
    channels: "rgba:8+8+8+8",
};

const schema = {
    arguments: {
        where: "in arguments to Rngon::texture()",
        allowAdditionalProperties: true,
        properties: {
            "pixels": ["Uint8ClampedArray", ["number"], "string"],
            "width": {
                type: ["number"],
                value(width) {
                    if ((width < 1) || (width > maxTextureWidth)) {
                        return `Texture width must be in the range [1, ${maxTextureWidth}]`
                    }
                },
            },
            "height": {
                type: ["number"],
                value(height) {
                    if ((height < 1) || (height > maxTextureHeight)) {
                        return `Texture height must be in the range [1, ${maxTextureHeight}]`
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
                        "binary",
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
        where: "in the return value of Rngon::texture()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Texture",
            },
            "width": ["number"],
            "height": ["number"],
            "pixels": ["Uint8ClampedArray"],
            "mipLevels": [["object", "Texture"]],
        },
    },
};

export function Texture(data = {})
{
    data = structuredClone(data);
    
    // Combine default data properties with the user-supplied ones.
    for (const key of Object.keys(textureDefaultData))
    {
        data.hasOwnProperty(key)? 1 : (data[key] = textureDefaultData[key]);
    }

    if (data.pixels === undefined)
    {
        data.pixels = new Array(data.width * data.height * 4);
    }

    validate_object?.(data, schema.arguments);

    decode_pixel_data(data);

    const publicInterface = {
        $constructor: "Texture",
        regenerate_mipmaps,
        ...data,
    };

    publicInterface.regenerate_mipmaps();

    validate_object?.(publicInterface, schema.interface);
    
    return publicInterface;
}

// Returns a Promise of a texture whose data is loaded from the given file. The actual
// texture object is returned once the data has been loaded.
Texture.load = async function(filename)
{
    try {
        const response = await fetch(filename);
        const textureData = await response.json();
        return Texture(textureData);
    }
    catch (error) {
        throw new Error(`Failed to create a texture with data from file '${filename}'. ${error}`);
    }
}

// Decodes the pixel data passed to Rngon.texture() into a Uint8ClampedArray that stores
// consecutive RGBA pixel color values.
function decode_pixel_data(data)
{
    if (data.encoding === "none")
    {
        Assert?.(
            (data.channels === "rgba:8+8+8+8") &&
            (data.pixels.length === (data.width * data.height * 4)),
            "Unencoded pixel data must be provided in 'rgba:8+8+8+8' format."
        );

        if (!(data.pixels instanceof Uint8ClampedArray))
        {
            data.pixels = new Uint8ClampedArray(data.pixels);
        }
    }
    else
    {
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
                case "binary":
                {
                    Assert?.(
                        (decoded.length === (data.width * data.height)),
                        "Unexpected data length for a Base64-encoded texture; expected 1 byte per pixel."
                    );

                    for (let i = 0; i < (data.width * data.height); i++)
                    {
                        const idx = (i * 4);
                        const colorValue = (255 * decoded.charCodeAt(i));
                        data.pixels[idx+0] = colorValue;
                        data.pixels[idx+1] = colorValue;
                        data.pixels[idx+2] = colorValue;
                        data.pixels[idx+3] = colorValue;
                    }

                    break;
                }
                default: throw new Error("Unrecognized value for texture 'channels' attribute."); break;
            }
        }
        else if (data.encoding !== "none")
        {
            throw new Error("Unknown texture data encoding '" + data.encoding + "'.");
        }
    }

    Assert?.(
        (data.pixels instanceof Uint8ClampedArray),
        "Expected texture data to be output as a Uint8ClampedArray."
    );

    Assert?.(
        (data.pixels.length === (data.width * data.height * numColorChannels)),
        "The texture's pixel array size doesn't match its width and height."
    );
}

// Each successive mipmap is one half of the previous mipmap's width and height, starting
// from the full resolution and working down to 1 x 1. So mipmaps[0] is the original
// full-resolution texture, and mipmaps[mipmaps.length-1] is the smallest, 1 x 1 texture.
function regenerate_mipmaps()
{
    Assert?.(
        this.hasOwnProperty("$constructor") &&
        (this.$constructor === "Texture"),
        "Expected 'this' to point to a Texture"
    );

    // The first mip level is the base image, so we can just reference the base data.
    this.mipLevels = [this];

    if (
        (this.width === 1) &&
        (this.height === 1)
    ){
        return;
    }

    for (let m = 1; ; m++)
    {
        const mipWidth = Math.max(1, Math.floor(this.width / Math.pow(2, m)));
        const mipHeight = Math.max(1, Math.floor(this.height / Math.pow(2, m)));

        // Downscale the texture image to the next mip level.
        const mipPixelData = [];
        {
            const deltaW = (this.width / mipWidth);
            const deltaH = (this.height / mipHeight);
    
            for (let y = 0; y < mipHeight; y++)
            {
                for (let x = 0; x < mipWidth; x++)
                {
                    const dstIdx = ((x + y * mipWidth) * numColorChannels);
                    const srcIdx = ((Math.floor(x * deltaW) + Math.floor(y * deltaH) * this.width) * numColorChannels);

                    for (let c = 0; c < numColorChannels; c++)
                    {
                        mipPixelData[dstIdx + c] = this.pixels[srcIdx + c];
                    }
                }
            }
        }

        this.mipLevels.push({
            width: mipWidth,
            height: mipHeight,
            pixels: mipPixelData,
        });

        // We're finished generating mip levels once we've done them down to 1 x 1.
        if ((mipWidth === 1) && (mipHeight === 1))
        {
            Assert?.(
                (this.mipLevels.length > 0),
                "Failed to generate mip levels for a texture."
            );

            break;
        }
    }

    return;
}
