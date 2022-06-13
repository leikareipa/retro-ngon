/*
 * 2019 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

// Red, green, blue, alpha; in the range 0..255.
export function color_rgba(
    red = 55,
    green = 55,
    blue = 55,
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
