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
}

// Global app state, for internal use by the renderer. Unless otherwise noted, these
// parameters should not be modified directly; they're instead set by the renderer
// based on settings requested by the user.
Rngon.internalState =
{
    // Whether to require pixels to pass a depth test before being allowed on screen.
    useDepthBuffer: false,
    depthBuffer: {width:1, height:1, buffer:new Array(1), clearValue:Number.MAX_VALUE},

    // Pixel buffer for rasterization.
    pixelBuffer: new ImageData(1, 1),

    usePerspectiveCorrectTexturing: false,

    // If set to true, all n-gons will be rendered with a wireframe.
    showGlobalWireframe: false,

    // If true, all n-gons will be clipped against the viewport.
    applyViewportClipping: true,

    // Whether the renderer is allowed to call window.alert(), e.g. to alert the user
    // to errors. This parameter can be set directly, as the render API doesn't yet
    // expose a way to toggle it otherwise.
    allowWindowAlert: false,

    // All transformed n-gons on a particular call to render() will be placed here.
    // The cache size will be dynamically adjusted up to match the largest number
    // of transformed n-gons, so at any given time the number of active n-gons (those
    // that have been transformed for the current frame) may be smaller than the
    // cache's total capacity.
    transformedNgonsCache: {numActiveNgons:0, ngons:[]},

    // All transformed (to eye space) lights on a particular call to render() will
    // be placed here. The cache size will be dynamically adjusted up to match the
    // largest number of transformed lights, so at any given time the number of active
    // lights (those that have been transformed for the current frame) may be smaller
    // than the cache's total capacity.
    transformedLightsCache: {numActiveLights:0, lights:[]},

    // All light sources that should currently apply to rendered n-gons.
    lights: [],
}
