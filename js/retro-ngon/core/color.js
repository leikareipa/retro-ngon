/*
 * 2019 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

// Red, green, blue, alpha; in the range [0,255].
export function color(
    red = 0,
    green = 0,
    blue = 0,
    alpha = 255
)
{
    Rngon.assert?.(
        (((red   >= 0) && (red   <= 255)) &&
         ((green >= 0) && (green <= 255)) &&
         ((blue  >= 0) && (blue  <= 255)) &&
         ((alpha >= 0) && (alpha <= 255))),
        "The given color values are out of range."
    );

    const publicInterface = Object.freeze({
        red,
        green,
        blue,
        alpha,
        unitRange: Object.freeze({
            red: (red / 255),
            green: (green / 255),
            blue: (blue / 255),
            alpha: (alpha / 255),
        }),
    });
    
    return publicInterface;
}

// Indexed color. Represents an entry in a palette.
export function color_index(index = 0)
{
    Rngon.assert?.((index >= 0), "The given color index is out of range.");

    const publicInterface = Object.freeze({
        index,
    });

    return publicInterface;
}
