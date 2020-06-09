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
    depthBuffer: {width:1, height:1, data:new Array(1), clearValue:Number.MAX_VALUE},

    // Pixel buffer for rasterization. This will be scaled to match the requested
    // render resolution; and the renderer's rasterization pass will populate it
    // with the rendered frame's pixel values.
    pixelBuffer: new ImageData(1, 1),

    // For each pixel in the rendered frame, metadata about the state of the renderer
    // at that pixel, intended to be used by shaders. The array's size will be set to
    // match the requested render resolution.
    fragmentBuffer: {width:1, height:1, data:new Array(1), clearValue:{
            // Index of this polygon in the list of transformed polygons.
            polygonIdx: undefined,

            // Texture coordinates at this pixel.
            textureU: undefined,
            textureV: undefined,

            // World coordinates at this pixel.
            worldX: undefined,
            worldY: undefined,
            worldZ: undefined,

            // Normal at this pixel.
            normalX: undefined,
            normalY: undefined,
            normalZ: undefined,

            // The value written into the depth buffer by this fragment.
            depth: undefined,
        }
    },

    // If true, enables the fragment buffer and allows the use of shaders. Note that
    // enabling shaders carries a performance penalty even if you don't actually make
    // use any shaders.
    useShaders: false,

    usePerspectiveCorrectTexturing: false,

    // If set to true, all n-gons will be rendered with a wireframe.
    showGlobalWireframe: false,

    // If true, all n-gons will be clipped against the viewport.
    applyViewportClipping: true,

    // Whether the renderer is allowed to call window.alert(), e.g. to alert the user
    // to errors. This parameter can be set directly, as the render API doesn't yet
    // expose a way to toggle it otherwise.
    allowWindowAlert: false,

    // All of the n-gons that were most recently passed to render(), transformed into
    // screen space.
    transformedNgonsCache: {count:0, ngons:[]},

    // All light sources that should currently apply to n-gons passed to render().
    lights: [],
}
