/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Top-level namespace for the retro n-gon renderer.
const Rngon = {};

// Various small utility functions.
{
    Rngon.lerp = (x, y, interval)=>(x + (interval * (y - x)));

    Rngon.assert = (condition = false, explanation = "(no reason given)")=>
    {
        if (!condition)
        {
            alert("Rngon assertion: " + explanation);
            throw Error("Rngon assertion: " + explanation);
        }
    }

    Rngon.log = (string = "Hello there.")=>
    {
        console.log("Rngon: " + string);
    }
}
