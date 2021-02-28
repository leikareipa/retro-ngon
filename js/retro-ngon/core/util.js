/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 * Various small utility functions and the like.
 *
 */

"use strict";

// Defined 'true' to allow for the conveniency of named in-place assertions,
// e.g. Rngon.assert && (x === 1) || Rngon.throw("X wasn't 1.").
// Note that setting this to 'false' won't disable assertions - for that,
// you'll want to search/replace "Rngon.assert &&" with "Rngon.assert ||"
// and keep this set to 'true'. The comparison against Rngon.assert may still
// be done, though (I guess depending on the JS engine's ability to optimize).
Object.defineProperty(Rngon, "assert", {value:true, writable:false});

Rngon.lerp = (x, y, interval)=>(x + (interval * (y - x)));

// Returns a bilinearly sampled value from a one-channel 2D image (or other
// such array of data). Expects the 'sampler' argument to be a function of
// the form (a, b)=>image[(x + a) + (y + b) * width], i.e. a function that
// returns the relevant image source value at XY, offset respectively by the
// two arguments to the function (the absolute XY coordinates are baked into
// the sampler function's body).
Rngon.bilinear_sample = (sampler, biasX = 0.5, biasY = biasX)=>
{
    const px1 = Rngon.lerp(sampler(0, 0), sampler(0, 1), biasY);
    const px2 = Rngon.lerp(sampler(1, 0), sampler(1, 1), biasY);
    return Rngon.lerp(px1, px2, biasX);
};

Rngon.throw = (errMessage = "")=>
{
    if (Rngon.internalState.allowWindowAlert)
    {
        window.alert("Retro n-gon error: " + errMessage);
    }

    throw Error("Retro n-gon error: " + errMessage);
}

Rngon.log = (string = "Hello there.")=>
{
    console.log("Retro n-gon: " + string);
}

// Returns the resulting width of an image if it were rendered onto the given canvas element.
// The 'scale' parameter corresponds to the 'scale' option of Rngon.render().
Rngon.renderable_width_of = function(canvasElement, scale)
{
    return Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * scale);
}

// Returns the resulting height of an image if it were rendered onto the given canvas element.
// The 'scale' parameter corresponds to the 'scale' option of Rngon.render().
Rngon.renderable_height_of = function(canvasElement, scale)
{
    return Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * scale);
}
