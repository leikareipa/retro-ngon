/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Top-level namespace for the retro n-gon renderer.
const Rngon = {};

// Various small utility functions and the like.
{
    // Defined 'true' to allow for the conveniency of named in-place assertions,
    // e.g. Rngon.assert && (x === 1) || Rngon.throw("X wasn't 1.").
    // Note that setting this to 'false' won't disable assertions - for that,
    // you'll want to search/replace "Rngon.assert &&" with "Rngon.assert ||"
    // and keep this set to 'true'. The comparison against Rngon.assert may still
    // be done, though (I guess depending on the JS engine's ability to optimize).
    Object.defineProperty(Rngon, "assert", {value:true, writable:false});

    Rngon.lerp = (x, y, interval)=>(x + (interval * (y - x)));

    Rngon.throw = (errMessage = "")=>
    {
        alert("Retro n-gon error: " + errMessage);
        throw Error("Retro n-gon error: " + errMessage);
    }

    Rngon.log = (string = "Hello there.")=>
    {
        console.log("Retro n-gon: " + string);
    }
}

// Global render toggles. These should not be modified directly; they're instead
// set by the renderer based on render parameters requested by the user.
{
    Rngon.internalState = {};

    // Whether to require pixels to pass a depth test before being allowed on screen.
    Rngon.internalState.useDepthBuffer = false;

    Rngon.internalState.usePerspectiveCorrectTexturing = false;

    // If set to true, all n-gons will be rendered with a wireframe.
    Rngon.internalState.showGlobalWireframe = false;

    Rngon.internalState.applyViewportClipping = true;
}
