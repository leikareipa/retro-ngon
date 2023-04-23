/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 * Various small utility functions and the like.
 *
 */

// Call this function using optional chaining: "Rsed.assert?.()".
// To disable assertions, comment out this function definition.
export function assert(condition, errorMessage)
{
    if (!condition)
    {
        $throw(errorMessage);
    }
}

export function lerp (x, y, interval)
{
    return (x + (interval * (y - x)));
}

// Returns a bilinearly sampled value from a one-channel 2D image (or other
// such array of data). Expects the 'sampler' argument to be a function of
// the form (a, b)=>image[(x + a) + (y + b) * width], i.e. a function that
// returns the relevant image source value at XY, offset respectively by the
// two arguments to the function (the absolute XY coordinates are baked into
// the sampler function's body).
export function bilinear_sample(sampler, biasX = 0.5, biasY = biasX)
{
    const px1 = lerp(sampler(0, 0), sampler(0, 1), biasY);
    const px2 = lerp(sampler(1, 0), sampler(1, 1), biasY);
    return lerp(px1, px2, biasX);
};

export function $throw(errMessage = "")
{
    throw Error(errMessage);
}

export function log(string = "Hello there.")
{
    console.log(string);
}

// Returns the resulting width of an image if it were rendered onto the given canvas element.
export function renderable_width_of(canvasElement, scale)
{
    return Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * scale);
}

// Returns the resulting height of an image if it were rendered onto the given canvas element.
export function renderable_height_of(canvasElement, scale)
{
    return Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * scale);
}
