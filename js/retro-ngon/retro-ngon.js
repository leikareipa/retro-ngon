/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Top-level namespace for the retro n-gon renderer.
const Rngon = {
    version: {family:"beta",major:"5",minor:"0",dev:true}
};

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
}

// Global app state, for internal use by the renderer. Unless otherwise noted, these
// parameters should not be modified directly; they're instead set by the renderer
// based on settings requested by the user.
Rngon.internalState =
{
    // Modules provide core renderer functionality in overridable packages (the
    // user can provide custom modules to be used in place of the default ones).
    // Each module is a function that performs a set of tasks.
    modules: {
        // Transforms the given n-gons into screen space, placing the transformed
        // n-gons into the internal n-gon cache. Also applies lighting and viewport
        // clipping.
        transform_clip_light: undefined,

        // Rasterizes the n-gons in the internal n-gon cache onto the current
        // render surface.
        ngon_fill: undefined,
    },

    // Whether to require pixels to pass a depth test before being allowed on screen.
    useDepthBuffer: false,
    depthBuffer: {width:1, height:1, data:new Array(1), clearValue:Infinity},

    // Pixel buffer for rasterization. This will be scaled to match the requested
    // render resolution; and the renderer's rasterization pass will populate it
    // with the rendered frame's pixel values.
    pixelBuffer: new ImageData(1, 1),

    // For each pixel in the rendered frame, metadata about the state of the renderer
    // at that pixel, intended to be used by shaders. The array's size will be set to
    // match the requested render resolution.
    fragmentBuffer: {width:1, height:1, data:new Array(1), clearValue:{
            // Index to an n-gon in the list of transformed n-gons that this pixel is
            // part of.
            ngonIdx: undefined,

            // Texture coordinates at this pixel, scaled to the dimensions of the
            // n-gon's texture and with any clamping/repetition applied. In other
            // words, these are the exact texture coordinates from which the pixel's
            // texel was obtained.
            textureUScaled: undefined,
            textureVScaled: undefined,

            // Which of the texture's mip levels was used. This is a value from 0
            // to n-1, where n is the total number of mip levels available in the
            // texture.
            textureMipLevelIdx: undefined,

            // World coordinates at this pixel.
            worldX: undefined,
            worldY: undefined,
            worldZ: undefined,

            // The value written into the depth buffer by this fragment.
            depth: undefined,

            // The light level (0..1) at this pixel as computed by the renderer's
            // built-in lighting engine.
            shade: undefined,

            w: undefined,
        }
    },

    // If true, enables the fragment buffer and allows the use of pixel shaders. Note
    // that enabling shaders carries a performance penalty even if you don't actually
    // make use of any pixel shaders.
    usePixelShaders: false,

    useVertexShaders: false,

    usePerspectiveCorrectInterpolation: false,

    // If set to true, all n-gons will be rendered with a wireframe.
    showGlobalWireframe: false,

    // If true, all n-gons will be clipped against the viewport.
    applyViewportClipping: true,

    // Distance, in world units, to the far clipping plane.
    farPlaneDistance: 1,

    // Whether the renderer is allowed to call window.alert(), e.g. to alert the user
    // to errors. This parameter can be set directly, as the render API doesn't yet
    // expose a way to toggle it otherwise.
    allowWindowAlert: false,

    // All of the n-gons that were most recently passed to render(), transformed into
    // screen space.
    ngonCache: {count:0, ngons:[]},

    // All light sources that should currently apply to n-gons passed to render().
    lights: [],
}
