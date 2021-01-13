// WHAT: Concatenated JavaScript source files
// PROGRAM: Retro n-gon renderer
// VERSION: beta live (13 January 2021 19:09:54 UTC)
// AUTHOR: Tarpeeksi Hyvae Soft and others
// LINK: https://www.github.com/leikareipa/retro-ngon/
// FILES:
//	./js/retro-ngon/retro-ngon.js
//	./js/retro-ngon/trig.js
//	./js/retro-ngon/light.js
//	./js/retro-ngon/color.js
//	./js/retro-ngon/vector3.js
//	./js/retro-ngon/vertex.js
//	./js/retro-ngon/mesh.js
//	./js/retro-ngon/ngon.js
//	./js/retro-ngon/line-draw.js
//	./js/retro-ngon/matrix44.js
//	./js/retro-ngon/ngon-fill.js
//	./js/retro-ngon/transform-and-light.js
//	./js/retro-ngon/render.js
//	./js/retro-ngon/render-async.js
//	./js/retro-ngon/render-shared.js
//	./js/retro-ngon/texture.js
//	./js/retro-ngon/surface.js
/////////////////////////////////////////////////

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

        // Removes all rendered pixels from the render surface.
        surface_wipe: undefined,
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
    usePixelShader: false,

    useVertexShader: false,

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
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Trigonometric lookup tables, and helper functions for accessing them.
Rngon.trig = (function()
{
    const publicInterface = Object.freeze(
    {
        // Returns approximations of sin() and cos() for degrees 0..359 given in
        // the range 0..65535. For instance, to get sin() for 144 deg, you'd call
        // sin(deg(144)), or alternatively sin(26214).
        // NOTE: Doesn't validate the input, so make sure it's in the correct range
        //       before calling these functions.
        sin: (x)=>sineLut[x>>6],
        cos: (x)=>sineLut[(x>>6)+256],

        // Transforms the given value 0..359 to the range 0..65535, which can, for
        // instance, be fed into the sin() and cos() helper functions, above.
        // Will wrap the input value to the correct range.
        // The magic number 182.04166666666666 is 65535/360.
        deg: (deg)=>(182.04166666666666 * (deg >= 0? (deg % 360) : (360 - (Math.abs(deg) % 360)))),
    });

    // Range: 0-1023 for sin() + 256 for approximating cos().
    const sineLut =
    [0.0000000,
    0.0061359, 0.0122715, 0.0184067, 0.0245412, 0.0306748, 0.0368072, 0.0429383, 0.0490677,
    0.0551952, 0.0613207, 0.0674439, 0.0735646, 0.0796824, 0.0857973, 0.0919090, 0.0980171,
    0.1041216, 0.1102222, 0.1163186, 0.1224107, 0.1284981, 0.1345807, 0.1406582, 0.1467305,
    0.1527972, 0.1588581, 0.1649131, 0.1709619, 0.1770042, 0.1830399, 0.1890687, 0.1950903,
    0.2011046, 0.2071114, 0.2131103, 0.2191012, 0.2250839, 0.2310581, 0.2370236, 0.2429802,
    0.2489276, 0.2548657, 0.2607941, 0.2667128, 0.2726214, 0.2785197, 0.2844075, 0.2902847,
    0.2961509, 0.3020059, 0.3078496, 0.3136817, 0.3195020, 0.3253103, 0.3311063, 0.3368899,
    0.3426607, 0.3484187, 0.3541635, 0.3598950, 0.3656130, 0.3713172, 0.3770074, 0.3826834,
    0.3883450, 0.3939920, 0.3996242, 0.4052413, 0.4108432, 0.4164296, 0.4220003, 0.4275551,
    0.4330938, 0.4386162, 0.4441221, 0.4496113, 0.4550836, 0.4605387, 0.4659765, 0.4713967,
    0.4767992, 0.4821838, 0.4875502, 0.4928982, 0.4982277, 0.5035384, 0.5088301, 0.5141027,
    0.5193560, 0.5245897, 0.5298036, 0.5349976, 0.5401715, 0.5453250, 0.5504580, 0.5555702,
    0.5606616, 0.5657318, 0.5707807, 0.5758082, 0.5808140, 0.5857979, 0.5907597, 0.5956993,
    0.6006165, 0.6055110, 0.6103828, 0.6152316, 0.6200572, 0.6248595, 0.6296382, 0.6343933,
    0.6391244, 0.6438315, 0.6485144, 0.6531728, 0.6578067, 0.6624158, 0.6669999, 0.6715590,
    0.6760927, 0.6806010, 0.6850837, 0.6895405, 0.6939715, 0.6983762, 0.7027547, 0.7071068,
    0.7114322, 0.7157308, 0.7200025, 0.7242471, 0.7284644, 0.7326543, 0.7368166, 0.7409511,
    0.7450578, 0.7491364, 0.7531868, 0.7572088, 0.7612024, 0.7651673, 0.7691033, 0.7730105,
    0.7768885, 0.7807372, 0.7845566, 0.7883464, 0.7921066, 0.7958369, 0.7995373, 0.8032075,
    0.8068476, 0.8104572, 0.8140363, 0.8175848, 0.8211025, 0.8245893, 0.8280450, 0.8314696,
    0.8348629, 0.8382247, 0.8415550, 0.8448536, 0.8481203, 0.8513552, 0.8545580, 0.8577286,
    0.8608669, 0.8639729, 0.8670462, 0.8700870, 0.8730950, 0.8760701, 0.8790122, 0.8819213,
    0.8847971, 0.8876396, 0.8904487, 0.8932243, 0.8959662, 0.8986745, 0.9013488, 0.9039893,
    0.9065957, 0.9091680, 0.9117060, 0.9142098, 0.9166791, 0.9191139, 0.9215140, 0.9238795,
    0.9262102, 0.9285061, 0.9307670, 0.9329928, 0.9351835, 0.9373390, 0.9394592, 0.9415441,
    0.9435935, 0.9456073, 0.9475856, 0.9495282, 0.9514350, 0.9533060, 0.9551412, 0.9569403,
    0.9587035, 0.9604305, 0.9621214, 0.9637761, 0.9653944, 0.9669765, 0.9685221, 0.9700313,
    0.9715039, 0.9729400, 0.9743394, 0.9757021, 0.9770281, 0.9783174, 0.9795698, 0.9807853,
    0.9819639, 0.9831055, 0.9842101, 0.9852776, 0.9863081, 0.9873014, 0.9882576, 0.9891765,
    0.9900582, 0.9909026, 0.9917098, 0.9924795, 0.9932119, 0.9939070, 0.9945646, 0.9951847,
    0.9957674, 0.9963126, 0.9968203, 0.9972905, 0.9977231, 0.9981181, 0.9984756, 0.9987955,
    0.9990777, 0.9993224, 0.9995294, 0.9996988, 0.9998306, 0.9999247, 0.9999812, 1.0000000,
    0.9999812, 0.9999247, 0.9998306, 0.9996988, 0.9995294, 0.9993224, 0.9990777, 0.9987955,
    0.9984756, 0.9981181, 0.9977231, 0.9972905, 0.9968203, 0.9963126, 0.9957674, 0.9951847,
    0.9945646, 0.9939070, 0.9932119, 0.9924795, 0.9917098, 0.9909026, 0.9900582, 0.9891765,
    0.9882576, 0.9873014, 0.9863081, 0.9852776, 0.9842101, 0.9831055, 0.9819639, 0.9807853,
    0.9795698, 0.9783174, 0.9770281, 0.9757021, 0.9743394, 0.9729400, 0.9715039, 0.9700313,
    0.9685221, 0.9669765, 0.9653944, 0.9637761, 0.9621214, 0.9604305, 0.9587035, 0.9569403,
    0.9551412, 0.9533060, 0.9514350, 0.9495282, 0.9475856, 0.9456073, 0.9435935, 0.9415441,
    0.9394592, 0.9373390, 0.9351835, 0.9329928, 0.9307670, 0.9285061, 0.9262102, 0.9238795,
    0.9215140, 0.9191139, 0.9166791, 0.9142098, 0.9117060, 0.9091680, 0.9065957, 0.9039893,
    0.9013488, 0.8986745, 0.8959662, 0.8932243, 0.8904487, 0.8876396, 0.8847971, 0.8819213,
    0.8790122, 0.8760701, 0.8730950, 0.8700870, 0.8670462, 0.8639729, 0.8608669, 0.8577286,
    0.8545580, 0.8513552, 0.8481203, 0.8448536, 0.8415550, 0.8382247, 0.8348629, 0.8314696,
    0.8280450, 0.8245893, 0.8211025, 0.8175848, 0.8140363, 0.8104572, 0.8068476, 0.8032075,
    0.7995373, 0.7958369, 0.7921066, 0.7883464, 0.7845566, 0.7807372, 0.7768885, 0.7730105,
    0.7691033, 0.7651673, 0.7612024, 0.7572088, 0.7531868, 0.7491364, 0.7450578, 0.7409511,
    0.7368166, 0.7326543, 0.7284644, 0.7242471, 0.7200025, 0.7157308, 0.7114322, 0.7071068,
    0.7027547, 0.6983762, 0.6939715, 0.6895405, 0.6850837, 0.6806010, 0.6760927, 0.6715590,
    0.6669999, 0.6624158, 0.6578067, 0.6531728, 0.6485144, 0.6438315, 0.6391244, 0.6343933,
    0.6296382, 0.6248595, 0.6200572, 0.6152316, 0.6103828, 0.6055110, 0.6006165, 0.5956993,
    0.5907597, 0.5857979, 0.5808140, 0.5758082, 0.5707807, 0.5657318, 0.5606616, 0.5555702,
    0.5504580, 0.5453250, 0.5401715, 0.5349976, 0.5298036, 0.5245897, 0.5193560, 0.5141027,
    0.5088301, 0.5035384, 0.4982277, 0.4928982, 0.4875502, 0.4821838, 0.4767992, 0.4713967,
    0.4659765, 0.4605387, 0.4550836, 0.4496113, 0.4441221, 0.4386162, 0.4330938, 0.4275551,
    0.4220003, 0.4164296, 0.4108432, 0.4052413, 0.3996242, 0.3939920, 0.3883450, 0.3826834,
    0.3770074, 0.3713172, 0.3656130, 0.3598950, 0.3541635, 0.3484187, 0.3426607, 0.3368899,
    0.3311063, 0.3253103, 0.3195020, 0.3136817, 0.3078496, 0.3020059, 0.2961509, 0.2902847,
    0.2844075, 0.2785197, 0.2726214, 0.2667128, 0.2607941, 0.2548657, 0.2489276, 0.2429802,
    0.2370236, 0.2310581, 0.2250839, 0.2191012, 0.2131103, 0.2071114, 0.2011046, 0.1950903,
    0.1890687, 0.1830399, 0.1770042, 0.1709619, 0.1649131, 0.1588581, 0.1527972, 0.1467305,
    0.1406582, 0.1345807, 0.1284981, 0.1224107, 0.1163186, 0.1102222, 0.1041216, 0.0980171,
    0.0919090, 0.0857973, 0.0796824, 0.0735646, 0.0674439, 0.0613207, 0.0551952, 0.0490677,
    0.0429383, 0.0368072, 0.0306748, 0.0245412, 0.0184067, 0.0122715, 0.0061359, 0.0000000,
    -0.0061359, -0.0122715, -0.0184067, -0.0245412, -0.0306748, -0.0368072, -0.0429383, -0.0490677,
    -0.0551952, -0.0613207, -0.0674439, -0.0735646, -0.0796824, -0.0857973, -0.0919090, -0.0980171,
    -0.1041216, -0.1102222, -0.1163186, -0.1224107, -0.1284981, -0.1345807, -0.1406582, -0.1467305,
    -0.1527972, -0.1588581, -0.1649131, -0.1709619, -0.1770042, -0.1830399, -0.1890687, -0.1950903,
    -0.2011046, -0.2071114, -0.2131103, -0.2191012, -0.2250839, -0.2310581, -0.2370236, -0.2429802,
    -0.2489276, -0.2548657, -0.2607941, -0.2667128, -0.2726214, -0.2785197, -0.2844075, -0.2902847,
    -0.2961509, -0.3020059, -0.3078496, -0.3136817, -0.3195020, -0.3253103, -0.3311063, -0.3368899,
    -0.3426607, -0.3484187, -0.3541635, -0.3598950, -0.3656130, -0.3713172, -0.3770074, -0.3826834,
    -0.3883450, -0.3939920, -0.3996242, -0.4052413, -0.4108432, -0.4164296, -0.4220003, -0.4275551,
    -0.4330938, -0.4386162, -0.4441221, -0.4496113, -0.4550836, -0.4605387, -0.4659765, -0.4713967,
    -0.4767992, -0.4821838, -0.4875502, -0.4928982, -0.4982277, -0.5035384, -0.5088301, -0.5141027,
    -0.5193560, -0.5245897, -0.5298036, -0.5349976, -0.5401715, -0.5453250, -0.5504580, -0.5555702,
    -0.5606616, -0.5657318, -0.5707807, -0.5758082, -0.5808140, -0.5857979, -0.5907597, -0.5956993,
    -0.6006165, -0.6055110, -0.6103828, -0.6152316, -0.6200572, -0.6248595, -0.6296382, -0.6343933,
    -0.6391244, -0.6438315, -0.6485144, -0.6531728, -0.6578067, -0.6624158, -0.6669999, -0.6715590,
    -0.6760927, -0.6806010, -0.6850837, -0.6895405, -0.6939715, -0.6983762, -0.7027547, -0.7071068,
    -0.7114322, -0.7157308, -0.7200025, -0.7242471, -0.7284644, -0.7326543, -0.7368166, -0.7409511,
    -0.7450578, -0.7491364, -0.7531868, -0.7572088, -0.7612024, -0.7651673, -0.7691033, -0.7730105,
    -0.7768885, -0.7807372, -0.7845566, -0.7883464, -0.7921066, -0.7958369, -0.7995373, -0.8032075,
    -0.8068476, -0.8104572, -0.8140363, -0.8175848, -0.8211025, -0.8245893, -0.8280450, -0.8314696,
    -0.8348629, -0.8382247, -0.8415550, -0.8448536, -0.8481203, -0.8513552, -0.8545580, -0.8577286,
    -0.8608669, -0.8639729, -0.8670462, -0.8700870, -0.8730950, -0.8760701, -0.8790122, -0.8819213,
    -0.8847971, -0.8876396, -0.8904487, -0.8932243, -0.8959662, -0.8986745, -0.9013488, -0.9039893,
    -0.9065957, -0.9091680, -0.9117060, -0.9142098, -0.9166791, -0.9191139, -0.9215140, -0.9238795,
    -0.9262102, -0.9285061, -0.9307670, -0.9329928, -0.9351835, -0.9373390, -0.9394592, -0.9415441,
    -0.9435935, -0.9456073, -0.9475856, -0.9495282, -0.9514350, -0.9533060, -0.9551412, -0.9569403,
    -0.9587035, -0.9604305, -0.9621214, -0.9637761, -0.9653944, -0.9669765, -0.9685221, -0.9700313,
    -0.9715039, -0.9729400, -0.9743394, -0.9757021, -0.9770281, -0.9783174, -0.9795698, -0.9807853,
    -0.9819639, -0.9831055, -0.9842101, -0.9852776, -0.9863081, -0.9873014, -0.9882576, -0.9891765,
    -0.9900582, -0.9909026, -0.9917098, -0.9924795, -0.9932119, -0.9939070, -0.9945646, -0.9951847,
    -0.9957674, -0.9963126, -0.9968203, -0.9972905, -0.9977231, -0.9981181, -0.9984756, -0.9987955,
    -0.9990777, -0.9993224, -0.9995294, -0.9996988, -0.9998306, -0.9999247, -0.9999812, -1.0000000,
    -0.9999812, -0.9999247, -0.9998306, -0.9996988, -0.9995294, -0.9993224, -0.9990777, -0.9987955,
    -0.9984756, -0.9981181, -0.9977231, -0.9972905, -0.9968203, -0.9963126, -0.9957674, -0.9951847,
    -0.9945646, -0.9939070, -0.9932119, -0.9924795, -0.9917098, -0.9909026, -0.9900582, -0.9891765,
    -0.9882576, -0.9873014, -0.9863081, -0.9852776, -0.9842101, -0.9831055, -0.9819639, -0.9807853,
    -0.9795698, -0.9783174, -0.9770281, -0.9757021, -0.9743394, -0.9729400, -0.9715039, -0.9700313,
    -0.9685221, -0.9669765, -0.9653944, -0.9637761, -0.9621214, -0.9604305, -0.9587035, -0.9569403,
    -0.9551412, -0.9533060, -0.9514350, -0.9495282, -0.9475856, -0.9456073, -0.9435935, -0.9415441,
    -0.9394592, -0.9373390, -0.9351835, -0.9329928, -0.9307670, -0.9285061, -0.9262102, -0.9238795,
    -0.9215140, -0.9191139, -0.9166791, -0.9142098, -0.9117060, -0.9091680, -0.9065957, -0.9039893,
    -0.9013488, -0.8986745, -0.8959662, -0.8932243, -0.8904487, -0.8876396, -0.8847971, -0.8819213,
    -0.8790122, -0.8760701, -0.8730950, -0.8700870, -0.8670462, -0.8639729, -0.8608669, -0.8577286,
    -0.8545580, -0.8513552, -0.8481203, -0.8448536, -0.8415550, -0.8382247, -0.8348629, -0.8314696,
    -0.8280450, -0.8245893, -0.8211025, -0.8175848, -0.8140363, -0.8104572, -0.8068476, -0.8032075,
    -0.7995373, -0.7958369, -0.7921066, -0.7883464, -0.7845566, -0.7807372, -0.7768885, -0.7730105,
    -0.7691033, -0.7651673, -0.7612024, -0.7572088, -0.7531868, -0.7491364, -0.7450578, -0.7409511,
    -0.7368166, -0.7326543, -0.7284644, -0.7242471, -0.7200025, -0.7157308, -0.7114322, -0.7071068,
    -0.7027547, -0.6983762, -0.6939715, -0.6895405, -0.6850837, -0.6806010, -0.6760927, -0.6715590,
    -0.6669999, -0.6624158, -0.6578067, -0.6531728, -0.6485144, -0.6438315, -0.6391244, -0.6343933,
    -0.6296382, -0.6248595, -0.6200572, -0.6152316, -0.6103828, -0.6055110, -0.6006165, -0.5956993,
    -0.5907597, -0.5857979, -0.5808140, -0.5758082, -0.5707807, -0.5657318, -0.5606616, -0.5555702,
    -0.5504580, -0.5453250, -0.5401715, -0.5349976, -0.5298036, -0.5245897, -0.5193560, -0.5141027,
    -0.5088301, -0.5035384, -0.4982277, -0.4928982, -0.4875502, -0.4821838, -0.4767992, -0.4713967,
    -0.4659765, -0.4605387, -0.4550836, -0.4496113, -0.4441221, -0.4386162, -0.4330938, -0.4275551,
    -0.4220003, -0.4164296, -0.4108432, -0.4052413, -0.3996242, -0.3939920, -0.3883450, -0.3826834,
    -0.3770074, -0.3713172, -0.3656130, -0.3598950, -0.3541635, -0.3484187, -0.3426607, -0.3368899,
    -0.3311063, -0.3253103, -0.3195020, -0.3136817, -0.3078496, -0.3020059, -0.2961509, -0.2902847,
    -0.2844075, -0.2785197, -0.2726214, -0.2667128, -0.2607941, -0.2548657, -0.2489276, -0.2429802,
    -0.2370236, -0.2310581, -0.2250839, -0.2191012, -0.2131103, -0.2071114, -0.2011046, -0.1950903,
    -0.1890687, -0.1830399, -0.1770042, -0.1709619, -0.1649131, -0.1588581, -0.1527972, -0.1467305,
    -0.1406582, -0.1345807, -0.1284981, -0.1224107, -0.1163186, -0.1102222, -0.1041216, -0.0980171,
    -0.0919090, -0.0857973, -0.0796824, -0.0735646, -0.0674439, -0.0613207, -0.0551952, -0.0490677,
    -0.0429383, -0.0368072, -0.0306748, -0.0245412, -0.0184067, -0.0122715, -0.0061359, -0.0000000,
    0.0061359, 0.0122715, 0.0184067, 0.0245412, 0.0306748, 0.0368072, 0.0429383, 0.0490677,
    0.0551952, 0.0613207, 0.0674439, 0.0735646, 0.0796824, 0.0857973, 0.0919090, 0.0980171,
    0.1041216, 0.1102222, 0.1163186, 0.1224107, 0.1284981, 0.1345807, 0.1406582, 0.1467305,
    0.1527972, 0.1588581, 0.1649131, 0.1709619, 0.1770042, 0.1830399, 0.1890687, 0.1950903,
    0.2011046, 0.2071114, 0.2131103, 0.2191012, 0.2250839, 0.2310581, 0.2370236, 0.2429802,
    0.2489276, 0.2548657, 0.2607941, 0.2667128, 0.2726214, 0.2785197, 0.2844075, 0.2902847,
    0.2961509, 0.3020059, 0.3078496, 0.3136817, 0.3195020, 0.3253103, 0.3311063, 0.3368899,
    0.3426607, 0.3484187, 0.3541635, 0.3598950, 0.3656130, 0.3713172, 0.3770074, 0.3826834,
    0.3883450, 0.3939920, 0.3996242, 0.4052413, 0.4108432, 0.4164296, 0.4220003, 0.4275551,
    0.4330938, 0.4386162, 0.4441221, 0.4496113, 0.4550836, 0.4605387, 0.4659765, 0.4713967,
    0.4767992, 0.4821838, 0.4875502, 0.4928982, 0.4982277, 0.5035384, 0.5088301, 0.5141027,
    0.5193560, 0.5245897, 0.5298036, 0.5349976, 0.5401715, 0.5453250, 0.5504580, 0.5555702,
    0.5606616, 0.5657318, 0.5707807, 0.5758082, 0.5808140, 0.5857979, 0.5907597, 0.5956993,
    0.6006165, 0.6055110, 0.6103828, 0.6152316, 0.6200572, 0.6248595, 0.6296382, 0.6343933,
    0.6391244, 0.6438315, 0.6485144, 0.6531728, 0.6578067, 0.6624158, 0.6669999, 0.6715590,
    0.6760927, 0.6806010, 0.6850837, 0.6895405, 0.6939715, 0.6983762, 0.7027547, 0.7071068,
    0.7114322, 0.7157308, 0.7200025, 0.7242471, 0.7284644, 0.7326543, 0.7368166, 0.7409511,
    0.7450578, 0.7491364, 0.7531868, 0.7572088, 0.7612024, 0.7651673, 0.7691033, 0.7730105,
    0.7768885, 0.7807372, 0.7845566, 0.7883464, 0.7921066, 0.7958369, 0.7995373, 0.8032075,
    0.8068476, 0.8104572, 0.8140363, 0.8175848, 0.8211025, 0.8245893, 0.8280450, 0.8314696,
    0.8348629, 0.8382247, 0.8415550, 0.8448536, 0.8481203, 0.8513552, 0.8545580, 0.8577286,
    0.8608669, 0.8639729, 0.8670462, 0.8700870, 0.8730950, 0.8760701, 0.8790122, 0.8819213,
    0.8847971, 0.8876396, 0.8904487, 0.8932243, 0.8959662, 0.8986745, 0.9013488, 0.9039893,
    0.9065957, 0.9091680, 0.9117060, 0.9142098, 0.9166791, 0.9191139, 0.9215140, 0.9238795,
    0.9262102, 0.9285061, 0.9307670, 0.9329928, 0.9351835, 0.9373390, 0.9394592, 0.9415441,
    0.9435935, 0.9456073, 0.9475856, 0.9495282, 0.9514350, 0.9533060, 0.9551412, 0.9569403,
    0.9587035, 0.9604305, 0.9621214, 0.9637761, 0.9653944, 0.9669765, 0.9685221, 0.9700313,
    0.9715039, 0.9729400, 0.9743394, 0.9757021, 0.9770281, 0.9783174, 0.9795698, 0.9807853,
    0.9819639, 0.9831055, 0.9842101, 0.9852776, 0.9863081, 0.9873014, 0.9882576, 0.9891765,
    0.9900582, 0.9909026, 0.9917098, 0.9924795, 0.9932119, 0.9939070, 0.9945646, 0.9951847,
    0.9957674, 0.9963126, 0.9968203, 0.9972905, 0.9977231, 0.9981181, 0.9984756, 0.9987955,
    0.9990777, 0.9993224, 0.9995294, 0.9996988, 0.9998306, 0.9999247, 0.9999812];

    return publicInterface;
})();
/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A light source.
Rngon.light = function(position = Rngon.translation_vector(0, 0, 0),
                       settings = {})
{
    Rngon.assert && (typeof position === "object")
                 || Rngon.throw("Expected numbers as parameters to the light factory.");

    settings = {
        ...Rngon.light.defaultSettings,
        ...settings,
    };

    const returnObject =
    {
        position,
        ...settings,
    };

    return returnObject;
}

Rngon.light.defaultSettings = {
    intensity: 100,

    // The maximum shade value that this light can generate. A value of 1 means
    // that a surface fully lit by this light displays its base color (or base
    // texel) and never a color brighter than that. A value higher than one will
    // boost the base color of a fully lit surface by that multiple.
    clip: 1,

    // How strongly the light's intensity attenuates with distance from the light
    // source. Values lower than 1 cause the light to attenuate less over a distance;
    // while values above 1 cause the light to attenuate more over a distance.
    attenuation: 1,
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Red, green, blue, alpha; in the range 0..255.
// NOTE: Expects to remain immutable.
Rngon.color_rgba = function(red = 55, green = 55, blue = 55, alpha = 255)
{
    Rngon.assert && (((red   >= 0) && (red   <= 255)) &&
                     ((green >= 0) && (green <= 255)) &&
                     ((blue  >= 0) && (blue  <= 255)) &&
                     ((alpha >= 0) && (alpha <= 255)))
                 || Rngon.throw("The given color values are out of range.");

    // Alternate range, 0..1.
    const unitRange = Object.freeze({red:red/255, green:green/255, blue:blue/255, alpha:alpha/255});

    const publicInterface = Object.freeze(
    {
        red,
        green,
        blue,
        alpha,

        unitRange,
    });
    
    return publicInterface;
}
/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// NOTE: The returned object is not immutable.
Rngon.vector3 = function(x = 0, y = 0, z = 0)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number")
                 || Rngon.throw("Expected numbers as parameters to the vector3 factory.");

    const returnObject =
    {
        x,
        y,
        z,
    };

    return returnObject;
}

// Convenience aliases for vector3.
Rngon.translation_vector = Rngon.vector3;
Rngon.rotation_vector    = (x, y, z)=>Rngon.vector3(Rngon.trig.deg(x), Rngon.trig.deg(y), Rngon.trig.deg(z));
Rngon.scaling_vector     = Rngon.vector3;

// Transforms the vector by the given 4x4 matrix.
Rngon.vector3.transform = function(v, m = [])
{
    Rngon.assert && (m.length === 16)
                 || Rngon.throw("Expected a 4 x 4 matrix to transform the vector by.");
    
    const x_ = ((m[0] * v.x) + (m[4] * v.y) + (m[ 8] * v.z));
    const y_ = ((m[1] * v.x) + (m[5] * v.y) + (m[ 9] * v.z));
    const z_ = ((m[2] * v.x) + (m[6] * v.y) + (m[10] * v.z));

    v.x = x_;
    v.y = y_;
    v.z = z_;
}

Rngon.vector3.normalize = function(v)
{
    const sn = ((v.x * v.x) + (v.y * v.y) + (v.z * v.z));

    if (sn != 0 && sn != 1)
    {
        const inv = (1 / Math.sqrt(sn));
        v.x *= inv;
        v.y *= inv;
        v.z *= inv;
    }
}

Rngon.vector3.dot = function(v, other)
{
    return ((v.x * other.x) + (v.y * other.y) + (v.z * other.z));
}

Rngon.vector3.cross = function(v, other)
{
    const c = Rngon.vector3();

    c.x = ((v.y * other.z) - (v.z * other.y));
    c.y = ((v.z * other.x) - (v.x * other.z));
    c.z = ((v.x * other.y) - (v.y * other.x));

    return c;
}

Rngon.vector3.invert = function(v)
{
    v.x *= -1;
    v.y *= -1;
    v.z *= -1;
}
/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// NOTE: The returned object is not immutable.
Rngon.vertex = function(x = 0, y = 0, z = 0,
                        u = 0, v = 0,
                        w = 1,
                        shade = 1,
                        worldX = x, worldY = y, worldZ = z)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number" &&
                     typeof w === "number" && typeof u === "number" && typeof v === "number" &&
                     typeof worldX === "number" && typeof worldY === "number" && typeof worldZ === "number")
                 || Rngon.throw("Expected numbers as parameters to the vertex factory.");

    const returnObject =
    {
        x,
        y,
        z,
        u,
        v,
        w,

        // A value in the range >= 0 that defines how lit this vertex is. A value of
        // 1 corresponds to fully lit, 0 to fully unlit.
        shade,

        // The vertex's original coordinates, before any transformations.
        worldX,
        worldY,
        worldZ,
    };

    return returnObject;
}

// Transforms the vertex by the given 4x4 matrix.
Rngon.vertex.transform = function(v, m = [])
{
    Rngon.assert && (m.length === 16)
                    || Rngon.throw("Expected a 4 x 4 matrix to transform the vertex by.");
    
    const x_ = ((m[0] * v.x) + (m[4] * v.y) + (m[ 8] * v.z) + (m[12] * v.w));
    const y_ = ((m[1] * v.x) + (m[5] * v.y) + (m[ 9] * v.z) + (m[13] * v.w));
    const z_ = ((m[2] * v.x) + (m[6] * v.y) + (m[10] * v.z) + (m[14] * v.w));
    const w_ = ((m[3] * v.x) + (m[7] * v.y) + (m[11] * v.z) + (m[15] * v.w));

    v.x = x_;
    v.y = y_;
    v.z = z_;
    v.w = w_;
}

// Applies perspective division to the vertex.
Rngon.vertex.perspective_divide = function(v)
{
    v.x /= v.w;
    v.y /= v.w;
}
/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A collection of ngons, with shared translation and rotation.
// NOTE: Expects to remain immutable.
Rngon.mesh = function(ngons = [Rngon.ngon()], transform = {})
{
    Rngon.assert && (ngons instanceof Array) || Rngon.throw("Expected a list of ngons for creating an ngon mesh.");
    Rngon.assert && (transform instanceof Object) || Rngon.throw("Expected an object with transformation properties.");

    Rngon.assert && (typeof Rngon.mesh.defaultTransform.rotation !== "undefined" &&
                     typeof Rngon.mesh.defaultTransform.translation !== "undefined" &&
                     typeof Rngon.mesh.defaultTransform.scaling !== "undefined")
                 || Rngon.throw("The default transforms object for mesh() is missing required properties.");

    // Combine default transformations with the user-supplied ones.
    transform =
    {
        ...Rngon.mesh.defaultTransform,
        ...transform
    };

    const publicInterface =
    {
        ngons,
        rotation: transform.rotation,
        translation: transform.translation,
        scale: transform.scaling,
    };
    
    return publicInterface;
}

Rngon.mesh.defaultTransform = 
{
    translation: Rngon.translation_vector(0, 0, 0),
    rotation: Rngon.rotation_vector(0, 0, 0),
    scaling: Rngon.scaling_vector(1, 1, 1)
};

Rngon.mesh.object_space_matrix = function(m)
{
    const translationMatrix = Rngon.matrix44.translation(m.translation.x,
                                                         m.translation.y,
                                                         m.translation.z);

    const rotationMatrix = Rngon.matrix44.rotation(m.rotation.x,
                                                   m.rotation.y,
                                                   m.rotation.z);

    const scalingMatrix = Rngon.matrix44.scaling(m.scale.x,
                                                 m.scale.y,
                                                 m.scale.z);

    return Rngon.matrix44.multiply(Rngon.matrix44.multiply(translationMatrix, rotationMatrix), scalingMatrix);
}
/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A single n-sided ngon.
// NOTE: The return object is not immutable.
Rngon.ngon = function(vertices = [Rngon.vertex()], material = {}, vertexNormals = Rngon.vector3(0, 1, 0))
{
    Rngon.assert && (vertices instanceof Array) || Rngon.throw("Expected an array of vertices to make an ngon.");
    Rngon.assert && (material instanceof Object) || Rngon.throw("Expected an object containing user-supplied options.");

    Rngon.assert && (typeof Rngon.ngon.defaultMaterial.color !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.texture !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasWireframe !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.wireframeColor !== "undefined")
                 || Rngon.throw("The default material object for ngon() is missing required properties.");

    // Assuming that only a single normal vector was provided, in which case, let's
    // duplicate that normal for all vertices.
    if (!Array.isArray(vertexNormals))
    {
        vertexNormals = new Array(vertices.length).fill().map(n=>Rngon.vector3(vertexNormals.x, vertexNormals.y, vertexNormals.z));
    }

    const faceNormal = vertexNormals.reduce((faceNormal, vertexNormal)=>
    {
        faceNormal.x += vertexNormal.x;
        faceNormal.y += vertexNormal.y;
        faceNormal.z += vertexNormal.z;

        return faceNormal;
    }, Rngon.vector3(0, 0, 0));
    Rngon.vector3.normalize(faceNormal);

    // Combine default material options with the user-supplied ones.
    material =
    {
        ...Rngon.ngon.defaultMaterial,
        ...material
    };

    // If we get vertex U or V coordinates in the range [0,-x], we want to change 0 to
    // -eps to avoid incorrect rounding during texture-mapping.
    {
        const hasNegativeU = vertices.map(v=>v.u).some(u=>(u < 0));
        const hasNegativeV = vertices.map(v=>v.v).some(v=>(v < 0));

        if (hasNegativeU || hasNegativeV)
        {
            for (const vert of vertices)
            {
                if (hasNegativeU && vert.u === 0) vert.u = -Number.EPSILON;
                if (hasNegativeV && vert.v === 0) vert.v = -Number.EPSILON;
            }
        }
    }

    const returnObject =
    {
        vertices,
        vertexNormals,
        normal: faceNormal,
        material,

        // A value in the range [0,1] that defines which mip level of this
        // n-gon's texture (if it has a texture) should be used when rendering.
        // A value of 0 is the maximum-resolution (base) mip level, 1 is the
        // lowest-resolution (1 x 1) mip level.
        mipLevel: 0,
    };

    return returnObject;
}

Rngon.ngon.defaultMaterial = 
{
    color: Rngon.color_rgba(255, 255, 255, 255),
    texture: null,
    textureMapping: "ortho",
    uvWrapping: "repeat",
    vertexShading: "none",
    renderVertexShade: true,
    ambientLightLevel: 0,
    hasWireframe: false,
    hasFill: true,
    isTwoSided: true,
    wireframeColor: Rngon.color_rgba(0, 0, 0),
    allowTransform: true,
    allowAlphaReject: true,
    allowAlphaBlend: true,
    auxiliary: {},
};

Rngon.ngon.perspective_divide = function(ngon)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.perspective_divide(vert);
    }
},

Rngon.ngon.transform = function(ngon, matrix44)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.transform(vert, matrix44);
    }
},

// Clips all vertices against the sides of the viewport. Adapted from Benny
// Bobaganoosh's 3d software renderer, the source for which is available at
// https://github.com/BennyQBD/3DSoftwareRenderer.
Rngon.ngon.clip_to_viewport = function(ngon)
{
    clip_on_axis("x", 1);
    clip_on_axis("x", -1);
    clip_on_axis("y", 1);
    clip_on_axis("y", -1);
    clip_on_axis("z", 1);
    clip_on_axis("z", -1);

    return;

    function clip_on_axis(axis, factor)
    {
        if (!ngon.vertices.length)
        {
            return;
        }

        if (ngon.vertices.length == 1)
        {
            // If the point is fully inside the viewport, allow it to stay.
            if (( ngon.vertices[0].x <= ngon.vertices[0].w) &&
                (-ngon.vertices[0].x <= ngon.vertices[0].w) &&
                ( ngon.vertices[0].y <= ngon.vertices[0].w) &&
                (-ngon.vertices[0].y <= ngon.vertices[0].w) &&
                ( ngon.vertices[0].z <= ngon.vertices[0].w) &&
                (-ngon.vertices[0].z <= ngon.vertices[0].w))
            {
                return;
            }

            ngon.vertices.length = 0;

            return;
        }

        let prevVertex = ngon.vertices[ngon.vertices.length - ((ngon.vertices.length == 2)? 2 : 1)];
        let prevComponent = (prevVertex[axis] * factor);
        let isPrevVertexInside = (prevComponent <= prevVertex.w);
        
        // The vertices array will be modified in-place by appending the clipped vertices
        // onto the end of the array, then removing the previous ones.
        let k = 0;
        let numOriginalVertices = ngon.vertices.length;
        for (let i = 0; i < numOriginalVertices; i++)
        {
            const curComponent = (ngon.vertices[i][axis] * factor);
            const thisVertexIsInside = (curComponent <= ngon.vertices[i].w);

            // If either the current vertex or the previous vertex is inside but the other isn't,
            // and they aren't both inside, interpolate a new vertex between them that lies on
            // the clipping plane.
            if (thisVertexIsInside ^ isPrevVertexInside)
            {
                const lerpStep = (prevVertex.w - prevComponent) /
                                  ((prevVertex.w - prevComponent) - (ngon.vertices[i].w - curComponent));

                if (Rngon.internalState.usePixelShader)
                {
                    ngon.vertices[numOriginalVertices + k++] = Rngon.vertex(Rngon.lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                                                                            Rngon.lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                                                                            Rngon.lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                                                                            Rngon.lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                                                                            Rngon.lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                                                                            Rngon.lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                                                                            Rngon.lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep),
                                                                            Rngon.lerp(prevVertex.worldX, ngon.vertices[i].worldX, lerpStep),
                                                                            Rngon.lerp(prevVertex.worldY, ngon.vertices[i].worldY, lerpStep),
                                                                            Rngon.lerp(prevVertex.worldZ, ngon.vertices[i].worldZ, lerpStep));
                }
                else
                {
                    ngon.vertices[numOriginalVertices + k++] = Rngon.vertex(Rngon.lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                                                                            Rngon.lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                                                                            Rngon.lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                                                                            Rngon.lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                                                                            Rngon.lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                                                                            Rngon.lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                                                                            Rngon.lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep));
                }
            }
            
            if (thisVertexIsInside)
            {
                ngon.vertices[numOriginalVertices + k++] = ngon.vertices[i];
            }

            prevVertex = ngon.vertices[i];
            prevComponent = curComponent;
            isPrevVertexInside = thisVertexIsInside;
        }

        ngon.vertices.splice(0, numOriginalVertices);

        return;
    }
}
"use strict";

// Draws a line between the two given vertices into the render's pixel buffer.
Rngon.line_draw = function(vert1 = Rngon.vertex(),
                           vert2 = Rngon.vertex(),
                           lineColor = null,
                           ngonIdx = 0,
                           ignoreDepthBuffer = false)
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const fragmentBuffer = (Rngon.internalState.usePixelShader? Rngon.internalState.fragmentBuffer.data : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;
    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;

    let x0 = Math.round(vert1.x);
    let y0 = Math.round(vert1.y);
    const x1 = Math.round(vert2.x);
    const y1 = Math.round(vert2.y);
    const lineLength = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));

    // Establish interpolation parameters.
    const w1 = (interpolatePerspective? vert1.w : 1);
    const w2 = (interpolatePerspective? vert2.w : 1);
    const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
    const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
    let startDepth = depth1/w1;
    const deltaDepth = ((depth2/w2 - depth1/w1) / lineLength);
    let startShade = vert1.shade/w1;
    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / lineLength);
    let startInvW = 1/w1;
    const deltaInvW = ((1/w2 - 1/w1) / lineLength);
    if (fragmentBuffer)
    {
        var startWorldX = vert1.worldX/w1;
        var deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / lineLength);

        var startWorldY = vert1.worldY/w1;
        var deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / lineLength);

        var startWorldZ = vert1.worldZ/w1;
        var deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / lineLength);
    }

    // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
    {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        const sx = ((x0 < x1)? 1 : -1);
        const sy = ((y0 < y1)? 1 : -1); 
        let err = (((dx > dy)? dx : -dy) / 2);

        const maxNumSteps = (renderWidth + renderHeight);
        let numSteps = 0;
        
        while (++numSteps < maxNumSteps)
        {
            put_pixel(x0, y0);

            if ((x0 === x1) && (y0 === y1))
            {
                break;
            }

            // Increment interpolated values.
            {
                startDepth += deltaDepth;
                startShade += deltaShade;
                startInvW += deltaInvW;

                if (fragmentBuffer)
                {
                    startWorldX += deltaWorldX;
                    startWorldY += deltaWorldY;
                    startWorldZ += deltaWorldZ;
                }
            }

            const e2 = err;
            if (e2 > -dx)
            {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dy)
            {
                err += dx;
                y0 += sy;
            }
        }

        function put_pixel(x, y)
        {
            const idx = ((x + y * renderWidth) * 4);
            const depthBufferIdx = (idx / 4);

            if ((x < 0) || (x >= renderWidth) ||
                (y < 0) || (y >= renderHeight))
            {
                return;
            }
            
            const depth = (startDepth / startInvW);
            const shade = (startShade / startInvW);

            // Depth test.
            if (!ignoreDepthBuffer && depthBuffer && (depthBuffer[depthBufferIdx] <= depth)) return;

            // Alpha test.
            if (lineColor.alpha !== 255) return;

            // Draw the pixel.
            {
                pixelBuffer[idx + 0] = (shade * lineColor.red);
                pixelBuffer[idx + 1] = (shade * lineColor.green);
                pixelBuffer[idx + 2] = (shade * lineColor.blue);
                pixelBuffer[idx + 3] = 255;

                if (depthBuffer)
                {
                    depthBuffer[depthBufferIdx] = depth;
                }

                if (fragmentBuffer)
                {
                    const fragment = fragmentBuffer[depthBufferIdx];
                    fragment.ngonIdx = ngonIdx;
                    fragment.textureUScaled = undefined; // We don't support textures on lines.
                    fragment.textureVScaled = undefined;
                    fragment.depth = (startDepth / startInvW);
                    fragment.shade = (startShade / startInvW);
                    fragment.worldX = (startWorldX / startInvW);
                    fragment.worldY = (startWorldY / startInvW);
                    fragment.worldZ = (startWorldZ / startInvW);
                    fragment.w = (1 / startInvW);
                }
            }

            return;
        }
    }
};
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 * 4-by-4 matrix manipulation.
 * 
 * Adapted and modified from code written originally by Benny Bobaganoosh for his 3d software
 * renderer (https://github.com/BennyQBD/3DSoftwareRenderer). Full attribution:
 * {
 *     Copyright (c) 2014, Benny Bobaganoosh
 *     All rights reserved.
 *
 *     Redistribution and use in source and binary forms, with or without
 *     modification, are permitted provided that the following conditions are met:
 *
 *     1. Redistributions of source code must retain the above copyright notice, this
 *         list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above copyright notice,
 *         this list of conditions and the following disclaimer in the documentation
 *         and/or other materials provided with the distribution.
 *
 *     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *     ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *     WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 *     ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *     LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 *     ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *     (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *     SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * }
 *
 */

"use strict";

// Provides manipulation of 4-by-4 matrices.
Rngon.matrix44 = (()=>
{
    return Object.freeze(
    {
        scaling: function(x = 0, y = 0, z = 0)
        {
            return Object.freeze([x, 0, 0, 0,
                                  0, y, 0, 0,
                                  0, 0, z, 0,
                                  0, 0, 0, 1]);
        },

        translation: function(x = 0, y = 0, z = 0)
        {
            return Object.freeze([1, 0, 0, 0,
                                  0, 1, 0, 0,
                                  0, 0, 1, 0,
                                  x, y, z, 1]);
        },

        rotation: function(x = 0, y = 0, z = 0)
        {
            const cos = Rngon.trig.cos;
            const sin = Rngon.trig.sin;

            const mx = [1,       0,       0,       0,
                        0,       cos(x),  -sin(x), 0,
                        0,       sin(x),  cos(x),  0,
                        0,       0,       0,       1];

            const my = [cos(y),  0,       sin(y),  0,
                        0,       1,       0,       0,
                        -sin(y), 0,       cos(y),  0,
                        0,       0,       0,       1];

            const mz = [cos(z),  -sin(z), 0,       0,
                        sin(z),  cos(z),  0,       0,
                        0,       0,       1,       0,
                        0,       0,       0,       1];

            const temp = Rngon.matrix44.multiply(my, mz);
            const mResult = Rngon.matrix44.multiply(mx, temp);

            Rngon.assert && (mResult.length === 16) || Rngon.throw("Expected a 4 x 4 matrix.");
            return Object.freeze(mResult);
        },

        perspective: function(fov = 0, aspectRatio = 0, zNear = 0, zFar = 0)
        {
            const fovHalf = Math.tan(fov / 2);
            const zRange = (zNear - zFar);

            return Object.freeze([(1 / (fovHalf * aspectRatio)), 0,             0,                             0,
                                   0,                            (1 / fovHalf), 0,                             0,
                                   0,                            0,             ((-zNear - zFar) / zRange),    1,
                                   0,                            0,             (2 * zFar * (zNear / zRange)), 0]);
        },

        ortho: function(width = 0, height = 0)
        {
            return Object.freeze([(width/2),     0,              0, 0,
                                  0,             -(height/2),    0, 0,
                                  0,             0,              1, 0,
                                  (width/2)-0.5, (height/2)-0.5, 0, 1]);
        },
        
        multiply: function(m1 = [], m2 = [])
        {
            Rngon.assert && ((m1.length === 16) && (m2.length === 16))
                         || Rngon.throw("Expected 4 x 4 matrices.");

            let mResult = [];
            for (let i = 0; i < 4; i++)
            {
                for (let j = 0; j < 4; j++)
                {
                    mResult[i + (j * 4)] = (m1[i + (0 * 4)] * m2[0 + (j * 4)]) +
                                           (m1[i + (1 * 4)] * m2[1 + (j * 4)]) +
                                           (m1[i + (2 * 4)] * m2[2 + (j * 4)]) +
                                           (m1[i + (3 * 4)] * m2[3 + (j * 4)]);
                }
            }

            Rngon.assert && (mResult.length === 16) || Rngon.throw("Expected a 4 x 4 matrix.");
            return Object.freeze(mResult);
        },
    });
})();
/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

{ // A block to limit the scope of the unit-global variables we set up, below.

// We'll sort the n-gon's vertices into those on its left side and those on its
// right side.
const leftVerts = new Array(500);
const rightVerts = new Array(500);

// Then we'll organize the sorted vertices into edges (lines between given two
// vertices). Once we've got the edges figured out, we can render the n-gon by filling
// in the spans between its edges.
const leftEdges = new Array(500).fill().map(e=>({}));
const rightEdges = new Array(500).fill().map(e=>({}));

let numLeftVerts = 0;
let numRightVerts = 0;
let numLeftEdges = 0;
let numRightEdges = 0;

// Rasterizes into the internal pixel buffer all n-gons currently stored in the
// internal n-gon cache.
//
// Note: Consider this the inner render loop; it may contain ugly things like
// code repetition for the benefit of performance. If you'd like to refactor the
// code, please benchmark its effects on performance first - maintaining or
// improving performance would be great, losing performance would be bad.
//
Rngon.ngon_filler = function(auxiliaryBuffers = [])
{
    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    const usePixelShader = Rngon.internalState.usePixelShader;
    const fragmentBuffer = Rngon.internalState.fragmentBuffer.data;
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const vertexSorters =
    {
        verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
        verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
    }

    // Rasterize the n-gons.
    for (let n = 0; n < Rngon.internalState.ngonCache.count; n++)
    {
        const ngon = Rngon.internalState.ngonCache.ngons[n];
        const material = ngon.material;

        let texture = null;
        let textureMipLevel = null;
        let textureMipLevelIdx = 0;
        if (material.texture)
        {
            texture = material.texture;

            const numMipLevels = texture.mipLevels.length;
            textureMipLevelIdx = Math.max(0, Math.min((numMipLevels - 1), Math.round((numMipLevels - 1) * ngon.mipLevel)));
            textureMipLevel = texture.mipLevels[textureMipLevelIdx];
        }

        Rngon.assert && (ngon.vertices.length < leftVerts.length)
                     || Rngon.throw("Overflowing the vertex buffer");

        numLeftVerts = 0;
        numRightVerts = 0;
        numLeftEdges = 0;
        numRightEdges = 0;

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }

        // Rasterize a point.
        if (ngon.vertices.length === 1)
        {
            const x = Math.min((renderWidth - 1), Math.max(0, Math.round(ngon.vertices[0].x)));
            const y = Math.min((renderHeight - 1), Math.max(0, Math.round(ngon.vertices[0].y)));
            const idx = ((x + y * renderWidth) * 4);
            const depthBufferIdx = (idx / 4);
            
            const depth = (ngon.vertices[0].z / Rngon.internalState.farPlaneDistance);
            const shade = (material.renderVertexShade? ngon.vertices[0].shade : 1);

            // Alpha test.
            if (material.color.alpha !== 255) continue;

            // Depth test.
            if (depthBuffer && (depthBuffer[depthBufferIdx] <= depth)) continue;

            const color = (texture? textureMipLevel.pixels[0] : material.color);
            
            // Write the pixel.
            {
                pixelBuffer[idx + 0] = (shade * color.red);
                pixelBuffer[idx + 1] = (shade * color.green);
                pixelBuffer[idx + 2] = (shade * color.blue);
                pixelBuffer[idx + 3] = 255;

                if (depthBuffer)
                {
                    depthBuffer[depthBufferIdx] = depth;
                }

                if (usePixelShader)
                {
                    const fragment = fragmentBuffer[depthBufferIdx];
                    fragment.ngonIdx = n;
                    fragment.textureUScaled = 0;
                    fragment.textureVScaled = 0;
                    fragment.depth = depth;
                    fragment.shade = shade;
                    fragment.worldX = ngon.vertices[0].worldX;
                    fragment.worldY = ngon.vertices[0].worldY;
                    fragment.worldZ = ngon.vertices[0].worldZ;
                    fragment.w = ngon.vertices[0].w;
                }
            }

            continue;
        }
        // Rasterize a line.
        else if (ngon.vertices.length === 2)
        {
            Rngon.line_draw(ngon.vertices[0], ngon.vertices[1], material.color, n, false);

            continue;
        }
        // Rasterize a polygon with 3 or more vertices.
        else
        {
            // Figure out which of the n-gon's vertices are on its left side and which on the
            // right. The vertices on both sides will be arranged from smallest Y to largest
            // Y, i.e. top-to-bottom in screen space. The top-most vertex and the bottom-most
            // vertex will be shared between the two sides.
            {
                // Generic algorithm for n-sided convex polygons.
                {
                    // Sort the vertices by height from smallest Y to largest Y.
                    ngon.vertices.sort(vertexSorters.verticalAscending);

                    const topVert = ngon.vertices[0];
                    const bottomVert = ngon.vertices[ngon.vertices.length-1];

                    leftVerts[numLeftVerts++] = topVert;
                    rightVerts[numRightVerts++] = topVert;

                    // Trace a line along XY between the top-most vertex and the bottom-most vertex;
                    // and for the intervening vertices, find whether they're to the left or right of
                    // that line on X. Being on the left means the vertex is on the n-gon's left side,
                    // otherwise it's on the right side.
                    for (let i = 1; i < (ngon.vertices.length - 1); i++)
                    {
                        const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));

                        if (ngon.vertices[i].x >= lr)
                        {
                            rightVerts[numRightVerts++] = ngon.vertices[i];
                        }
                        else
                        {
                            leftVerts[numLeftVerts++] = ngon.vertices[i];
                        }
                    }

                    leftVerts[numLeftVerts++] = bottomVert;
                    rightVerts[numRightVerts++] = bottomVert;
                }
            }

            // Create edges out of the vertices.
            {
                for (let l = 1; l < numLeftVerts; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
                for (let r = 1; r < numRightVerts; r++) add_edge(rightVerts[r-1], rightVerts[r], false);

                function add_edge(vert1, vert2, isLeftEdge)
                {
                    const startY = Math.min(renderHeight, Math.max(0, Math.round(vert1.y)));
                    const endY = Math.min(renderHeight, Math.max(0, Math.round(vert2.y)));
                    const edgeHeight = (endY - startY);
                    
                    // Ignore horizontal edges.
                    if (edgeHeight === 0) return;

                    const w1 = interpolatePerspective? vert1.w : 1;
                    const w2 = interpolatePerspective? vert2.w : 1;

                    const startX = Math.min(renderWidth, Math.max(0, Math.round(vert1.x)));
                    const endX = Math.min(renderWidth, Math.max(0, Math.ceil(vert2.x)));
                    const deltaX = ((endX - startX) / edgeHeight);

                    const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
                    const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
                    const startDepth = depth1/w1;
                    const deltaDepth = ((depth2/w2 - depth1/w1) / edgeHeight);

                    const startShade = vert1.shade/w1;
                    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / edgeHeight);

                    const u1 = (material.texture? vert1.u : 1);
                    const v1 = (material.texture? vert1.v : 1);
                    const u2 = (material.texture? vert2.u : 1);
                    const v2 = (material.texture? vert2.v : 1);
                    const startU = u1/w1;
                    const deltaU = ((u2/w2 - u1/w1) / edgeHeight);
                    const startV = v1/w1;
                    const deltaV = ((v2/w2 - v1/w1) / edgeHeight);

                    const startInvW = 1/w1;
                    const deltaInvW = ((1/w2 - 1/w1) / edgeHeight);

                    const edge = (isLeftEdge? leftEdges[numLeftEdges++] : rightEdges[numRightEdges++]);
                    edge.startY = startY;
                    edge.endY = endY;
                    edge.startX = startX;
                    edge.deltaX = deltaX;
                    edge.startDepth = startDepth;
                    edge.deltaDepth = deltaDepth;
                    edge.startShade = startShade;
                    edge.deltaShade = deltaShade;
                    edge.startU = startU;
                    edge.deltaU = deltaU;
                    edge.startV = startV;
                    edge.deltaV = deltaV;
                    edge.startInvW = startInvW;
                    edge.deltaInvW = deltaInvW;

                    if (usePixelShader)
                    {
                        edge.startWorldX = vert1.worldX/w1;
                        edge.deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / edgeHeight);

                        edge.startWorldY = vert1.worldY/w1;
                        edge.deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / edgeHeight);

                        edge.startWorldZ = vert1.worldZ/w1;
                        edge.deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / edgeHeight);
                    }
                }
            }

            // Draw the n-gon. On each horizontal raster line, there will be two edges: left and right.
            // We'll render into the pixel buffer each horizontal span that runs between the two edges.
            if (material.hasFill)
            {
                let curLeftEdgeIdx = 0;
                let curRightEdgeIdx = 0;
                let leftEdge = leftEdges[curLeftEdgeIdx];
                let rightEdge = rightEdges[curRightEdgeIdx];
                
                if (!numLeftEdges || !numRightEdges) continue;

                // Note: We assume the n-gon's vertices to be sorted by increasing Y.
                const ngonStartY = leftEdges[0].startY;
                const ngonEndY = leftEdges[numLeftEdges-1].endY;
                
                // Rasterize the n-gon in horizontal pixel spans over its height.
                for (let y = ngonStartY; y < ngonEndY; y++)
                {
                    const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
                    const spanEndX = Math.min(renderWidth, Math.max(0, Math.round(rightEdge.startX)));
                    const spanWidth = ((spanEndX - spanStartX) + 1);

                    if (spanWidth > 0)
                    {
                        const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                        let iplDepth = (leftEdge.startDepth - deltaDepth);

                        const deltaShade = ((rightEdge.startShade - leftEdge.startShade) / spanWidth);
                        let iplShade = (leftEdge.startShade - deltaShade);

                        const deltaU = ((rightEdge.startU - leftEdge.startU) / spanWidth);
                        let iplU = (leftEdge.startU - deltaU);

                        const deltaV = ((rightEdge.startV - leftEdge.startV) / spanWidth);
                        let iplV = (leftEdge.startV - deltaV);

                        const deltaInvW = ((rightEdge.startInvW - leftEdge.startInvW) / spanWidth);
                        let iplInvW = (leftEdge.startInvW - deltaInvW);

                        if (usePixelShader)
                        {
                            var deltaWorldX = ((rightEdge.startWorldX - leftEdge.startWorldX) / spanWidth);
                            var iplWorldX = (leftEdge.startWorldX - deltaWorldX);

                            var deltaWorldY = ((rightEdge.startWorldY - leftEdge.startWorldY) / spanWidth);
                            var iplWorldY = (leftEdge.startWorldY - deltaWorldY);

                            var deltaWorldZ = ((rightEdge.startWorldZ - leftEdge.startWorldZ) / spanWidth);
                            var iplWorldZ = (leftEdge.startWorldZ - deltaWorldZ);
                        }

                        // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                        let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                        // Assumes the depth buffer consists of 1 element per pixel.
                        let depthBufferIdx = (pixelBufferIdx / 4);

                        // Draw the span into the pixel buffer.
                        for (let x = spanStartX; x < spanEndX; x++)
                        {
                            // Will hold the texture coordinates used if we end up drawing
                            // a textured pixel at the current x,y screen location.
                            let u = 0.0, v = 0.0;

                            // Update values that're interpolated horizontally along the span.
                            iplDepth += deltaDepth;
                            iplShade += deltaShade;
                            iplU += deltaU;
                            iplV += deltaV;
                            iplInvW += deltaInvW;
                            pixelBufferIdx += 4;
                            depthBufferIdx++;

                            if (usePixelShader)
                            {
                                iplWorldX += deltaWorldX;
                                iplWorldY += deltaWorldY;
                                iplWorldZ += deltaWorldZ;
                            }

                            const depth = (iplDepth / iplInvW);

                            // Depth test.
                            if (depthBuffer && (depthBuffer[depthBufferIdx] <= depth)) continue;

                            const shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);

                            // The color we'll write into the pixel buffer for this pixel; assuming
                            // it passes the alpha test, the depth test, etc.
                            let red = 0;
                            let green = 0;
                            let blue = 0;

                            // Solid fill.
                            if (!texture)
                            {
                                // Alpha-blend the polygon. For partial transparency, we'll reject
                                // pixels in a particular pattern to create a see-through stipple
                                // effect.
                                if (material.allowAlphaBlend && (material.color.alpha < 255))
                                {
                                    // Full transparency.
                                    if (material.color.alpha <= 0)
                                    {
                                        continue;
                                    }
                                    // Partial transparency.
                                    else
                                    {
                                        const stipplePatternIdx = Math.floor(material.color.alpha / (256 / Rngon.ngon_filler.stipple_patterns.length));
                                        const stipplePattern    = Rngon.ngon_filler.stipple_patterns[stipplePatternIdx];
                                        const stipplePixelIdx   = ((x % stipplePattern.width) + (y % stipplePattern.height) * stipplePattern.width);

                                        // Reject by stipple pattern.
                                        if (stipplePattern.pixels[stipplePixelIdx]) continue;
                                    }   
                                }

                                red   = (material.color.red   * shade);
                                green = (material.color.green * shade);
                                blue  = (material.color.blue  * shade);
                            }
                            // Textured fill.
                            else
                            {
                                switch (material.textureMapping)
                                {
                                    // Affine mapping for power-of-two textures.
                                    case "affine":
                                    {
                                        u = (iplU / iplInvW);
                                        v = (iplV / iplInvW);

                                        switch (material.uvWrapping)
                                        {
                                            case "clamp":
                                            {
                                                const signU = Math.sign(u);
                                                const signV = Math.sign(v);
                                                const upperLimit = (1 - Number.EPSILON);

                                                u = Math.max(0, Math.min(Math.abs(u), upperLimit));
                                                v = Math.max(0, Math.min(Math.abs(v), upperLimit));

                                                // Negative UV coordinates flip the texture.
                                                if (signU === -1) u = (upperLimit - u);
                                                if (signV === -1) v = (upperLimit - v);

                                                u *= textureMipLevel.width;
                                                v *= textureMipLevel.height;

                                                break;
                                            }
                                            case "repeat":
                                            {
                                                u -= Math.floor(u);
                                                v -= Math.floor(v);

                                                u *= textureMipLevel.width;
                                                v *= textureMipLevel.height;

                                                // Modulo for power-of-two. This will also flip the texture for
                                                // negative UV coordinates.
                                                u = (u & (textureMipLevel.width - 1));
                                                v = (v & (textureMipLevel.height - 1));

                                                break;
                                            }
                                            default: Rngon.throw("Unrecognized UV wrapping mode."); break;
                                        }

                                        break;
                                    }
                                    // Affine mapping for wrapping non-power-of-two textures.
                                    /// FIXME: This implementation is a bit kludgy.
                                    /// TODO: Add clamped UV wrapping mode (we can just use the one for
                                    /// power-of-two textures).
                                    case "affine-npot":
                                    {
                                        u = (iplU / iplInvW);
                                        v = (iplV / iplInvW);

                                        u *= textureMipLevel.width;
                                        v *= textureMipLevel.height;
                
                                        // Wrap with repetition.
                                        /// FIXME: Why do we need to test for UV < 0 even when using positive
                                        /// but tiling UV coordinates? Doesn't render properly unless we do.
                                        if ((u < 0) ||
                                            (v < 0) ||
                                            (u >= textureMipLevel.width) ||
                                            (v >= textureMipLevel.height))
                                        {
                                            const uWasNeg = (u < 0);
                                            const vWasNeg = (v < 0);
                
                                            u = (Math.abs(u) % textureMipLevel.width);
                                            v = (Math.abs(v) % textureMipLevel.height);
                
                                            if (uWasNeg) u = (textureMipLevel.width - u);
                                            if (vWasNeg) v = (textureMipLevel.height - v);
                                        }
                
                                        break;
                                    }
                                    // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
                                    case "ortho":
                                    {
                                        const ngonHeight = (ngonEndY - ngonStartY);

                                        // Pixel coordinates relative to the polygon.
                                        const ngonX = (x - spanStartX + 1);
                                        const ngonY = (y - ngonStartY + 1);

                                        u = (ngonX * (textureMipLevel.width / spanWidth));
                                        v = (ngonY * (textureMipLevel.height / ngonHeight));

                                        // The texture image is flipped, so we need to flip V as well.
                                        v = (textureMipLevel.height - v);

                                        break;
                                    }
                                    default: Rngon.throw("Unknown texture-mapping mode."); break;
                                }

                                const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];

                                // Make sure we gracefully exit if accessing the texture out of bounds.
                                if (!texel) continue;

                                // Alpha-test the texture. If the texel isn't fully opaque, skip it.
                                if (material.allowAlphaReject && (texel.alpha !== 255)) continue;

                                // Alpha-blend the polygon. For partial transparency, we'll reject
                                // pixels in a particular pattern to create a see-through stipple
                                // effect.
                                if (material.allowAlphaBlend && (material.color.alpha < 255))
                                {
                                    // Full transparency.
                                    if (material.color.alpha <= 0)
                                    {
                                        continue;
                                    }
                                    // Partial transparency.
                                    else
                                    {
                                        const stipplePatternIdx = Math.floor(material.color.alpha / (256 / Rngon.ngon_filler.stipple_patterns.length));
                                        const stipplePattern    = Rngon.ngon_filler.stipple_patterns[stipplePatternIdx];
                                        const stipplePixelIdx   = ((x % stipplePattern.width) + (y % stipplePattern.height) * stipplePattern.width);

                                        // Reject by stipple pattern.
                                        if (stipplePattern.pixels[stipplePixelIdx]) continue;
                                    }   
                                }

                                red   = (texel.red   * material.color.unitRange.red   * shade);
                                green = (texel.green * material.color.unitRange.green * shade);
                                blue  = (texel.blue  * material.color.unitRange.blue  * shade);
                            }

                            // The pixel passed its alpha test, depth test, etc., and should be drawn
                            // on screen.
                            {
                                pixelBuffer[pixelBufferIdx + 0] = red;
                                pixelBuffer[pixelBufferIdx + 1] = green;
                                pixelBuffer[pixelBufferIdx + 2] = blue;
                                pixelBuffer[pixelBufferIdx + 3] = 255;

                                if (depthBuffer)
                                {
                                    depthBuffer[depthBufferIdx] = depth;
                                }

                                for (let b = 0; b < auxiliaryBuffers.length; b++)
                                {
                                    if (material.auxiliary[auxiliaryBuffers[b].property] !== null)
                                    {
                                        // Buffers are expected to consist of one element per pixel.
                                        auxiliaryBuffers[b].buffer[depthBufferIdx] = material.auxiliary[auxiliaryBuffers[b].property];
                                    }
                                }

                                if (usePixelShader)
                                {
                                    const fragment = fragmentBuffer[depthBufferIdx];
                                    fragment.ngonIdx = n;
                                    fragment.textureUScaled = ~~u;
                                    fragment.textureVScaled = ~~v;
                                    fragment.depth = (iplDepth / iplInvW);
                                    fragment.shade = (iplShade / iplInvW);
                                    fragment.worldX = (iplWorldX / iplInvW);
                                    fragment.worldY = (iplWorldY / iplInvW);
                                    fragment.worldZ = (iplWorldZ / iplInvW);
                                    fragment.w = (1 / iplInvW);
                                }
                            }
                        }
                    }

                    // Update values that're interpolated vertically along the edges.
                    {
                        leftEdge.startX      += leftEdge.deltaX;
                        leftEdge.startDepth  += leftEdge.deltaDepth;
                        leftEdge.startShade  += leftEdge.deltaShade;
                        leftEdge.startU      += leftEdge.deltaU;
                        leftEdge.startV      += leftEdge.deltaV;
                        leftEdge.startInvW   += leftEdge.deltaInvW;

                        rightEdge.startX     += rightEdge.deltaX;
                        rightEdge.startDepth += rightEdge.deltaDepth;
                        rightEdge.startShade += rightEdge.deltaShade;
                        rightEdge.startU     += rightEdge.deltaU;
                        rightEdge.startV     += rightEdge.deltaV;
                        rightEdge.startInvW  += rightEdge.deltaInvW;

                        if (usePixelShader)
                        {
                            leftEdge.startWorldX  += leftEdge.deltaWorldX;
                            leftEdge.startWorldY  += leftEdge.deltaWorldY;
                            leftEdge.startWorldZ  += leftEdge.deltaWorldZ;

                            rightEdge.startWorldX += rightEdge.deltaWorldX;
                            rightEdge.startWorldY += rightEdge.deltaWorldY;
                            rightEdge.startWorldZ += rightEdge.deltaWorldZ;
                        }
                    }

                    // We can move onto the next edge when we're at the end of the current one.
                    if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
                    if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
                }
            }

            // Draw a wireframe around any n-gons that wish for one.
            if (Rngon.internalState.showGlobalWireframe ||
                material.hasWireframe)
            {
                for (let l = 1; l < numLeftVerts; l++)
                {
                    Rngon.line_draw(leftVerts[l-1], leftVerts[l], material.wireframeColor, n, true);
                }

                for (let r = 1; r < numRightVerts; r++)
                {
                    Rngon.line_draw(rightVerts[r-1], rightVerts[r], material.wireframeColor, n, true);
                }
            }
        }
    }

    return;
}

// Create a set of stipple patterns for emulating transparency.
{
    Rngon.ngon_filler.stipple_patterns = [
        // ~1% transparent.
        {
            width: 8,
            height: 6,
            pixels: [0,1,1,1,0,1,1,1,
                     1,1,1,1,1,1,1,1,
                     1,1,1,1,1,1,1,1,
                     1,1,0,1,1,1,0,1,
                     1,1,1,1,1,1,1,1,
                     1,1,1,1,1,1,1,1],
        },

        {
            width: 4,
            height: 4,
            pixels: [0,1,0,1,
                     1,1,1,1,
                     1,0,1,0,
                     1,1,1,1],
        },

        // 50% transparent.
        {
            width: 2,
            height: 2,
            pixels: [1,0,
                     0,1],
        },
    ];

    // Append a reverse set of patterns to go from 50% to ~99% transparent.
    for (let i = (Rngon.ngon_filler.stipple_patterns.length - 2); i >= 0; i--)
    {
        Rngon.ngon_filler.stipple_patterns.push({
                width: Rngon.ngon_filler.stipple_patterns[i].width,
                height: Rngon.ngon_filler.stipple_patterns[i].height,
                pixels: Rngon.ngon_filler.stipple_patterns[i].pixels.map(p=>Number(!p)),
            });
    }
}

}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Applies lighting to the given n-gons, and transforms them into screen space
// for rendering. The processed n-gons are stored in the internal n-gon cache.
Rngon.ngon_transform_and_light = function(ngons = [],
                                          objectMatrix = [],
                                          cameraMatrix = [],
                                          projectionMatrix = [],
                                          screenSpaceMatrix = [],
                                          cameraPos)
{
    const viewVector = {x:0.0, y:0.0, z:0.0};
    const ngonCache = Rngon.internalState.ngonCache;
    const clipSpaceMatrix = Rngon.matrix44.multiply(projectionMatrix, cameraMatrix);

    for (const ngon of ngons)
    {
        // Ignore fully transparent polygons.
        if (!ngon.material.color.alpha &&
            !ngon.material.hasWireframe)
        {
            continue;
        }

        // Backface culling.
        if (!ngon.material.isTwoSided)
        {
            viewVector.x = (ngon.vertices[0].x - cameraPos.x);
            viewVector.y = (ngon.vertices[0].y - cameraPos.y);
            viewVector.z = (ngon.vertices[0].z - cameraPos.z);

            if (Rngon.vector3.dot(ngon.normal, viewVector) >= 0)
            {
                continue;
            }
        }

        // Copy the ngon into the internal n-gon cache, so we can operate on it without
        // mutating the original n-gon's data.
        const cachedNgon = ngonCache.ngons[ngonCache.count++];
        {
            cachedNgon.vertices.length = 0;

            for (let v = 0; v < ngon.vertices.length; v++)
            {
                cachedNgon.vertices[v] = Rngon.vertex(ngon.vertices[v].x,
                                                      ngon.vertices[v].y,
                                                      ngon.vertices[v].z,
                                                      ngon.vertices[v].u,
                                                      ngon.vertices[v].v,
                                                      ngon.vertices[v].w,
                                                      ngon.vertices[v].shade);

                if (Rngon.internalState.useVertexShader ||
                    (ngon.material.vertexShading === "gouraud"))
                {
                    cachedNgon.vertexNormals[v] = Rngon.vector3(ngon.vertexNormals[v].x,
                                                                ngon.vertexNormals[v].y,
                                                                ngon.vertexNormals[v].z);
                }
            }

            cachedNgon.material = ngon.material;
            cachedNgon.normal.x = ngon.normal.x;
            cachedNgon.normal.y = ngon.normal.y;
            cachedNgon.normal.z = ngon.normal.z;
            cachedNgon.isActive = true;
            cachedNgon.mipLevel = ngon.mipLevel;
        }

        // Transform vertices into screen space and apply clipping. We'll do the transforming
        // in steps: first into object space, then into clip space, and finally into screen
        // space.
        if (cachedNgon.material.allowTransform)
        {
            // Object space. Any built-in lighting is applied, if requested by the n-gon's
            // material.
            {
                Rngon.ngon.transform(cachedNgon, objectMatrix);

                // Interpolated world XYZ coordinates will be made available to shaders,
                // but aren't needed if shaders are disabled.
                if (Rngon.internalState.usePixelShader)
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        cachedNgon.vertices[v].worldX = cachedNgon.vertices[v].x;
                        cachedNgon.vertices[v].worldY = cachedNgon.vertices[v].y;
                        cachedNgon.vertices[v].worldZ = cachedNgon.vertices[v].z;
                    }
                }

                // If using Gouraud shading, we need to transform all vertex normals; but
                // the face normal won't be used and so can be ignored.
                if (Rngon.internalState.useVertexShader ||
                    (cachedNgon.material.vertexShading === "gouraud"))
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        Rngon.vector3.transform(cachedNgon.vertexNormals[v], objectMatrix);
                        Rngon.vector3.normalize(cachedNgon.vertexNormals[v]);
                    }
                }
                // With shading other than Gouraud, only the face normal will be used, and
                // we can ignore the vertex normals.
                else
                {
                    Rngon.vector3.transform(cachedNgon.normal, objectMatrix);
                    Rngon.vector3.normalize(cachedNgon.normal);
                }

                if (cachedNgon.material.vertexShading !== "none")
                {
                    Rngon.ngon_transform_and_light.apply_lighting(cachedNgon);
                }

                // Apply an optional, user-defined vertex shader.
                if (Rngon.internalState.useVertexShader)
                {
                    const args = [
                        cachedNgon,
                        cameraPos,
                    ];

                    const paramNamesString = "ngon, cameraPos";

                    switch (typeof Rngon.internalState.vertex_shader)
                    {
                        case "function":
                        {
                            Rngon.internalState.vertex_shader(...args);
                            break;
                        }
                        // Shader functions as strings are supported to allow shaders to be
                        // used in Web Workers. These strings are expected to be of - or
                        // equivalent to - the form "(a)=>{console.log(a)}".
                        case "string":
                        {
                            Function(paramNamesString, `(${Rngon.internalState.vertex_shader})(${paramNamesString})`)(...args);
                            break;
                        }
                        default:
                        {
                            Rngon.throw("Unrecognized type of vertex shader function.");
                            break;
                        }
                    }
                }
            }

            // Clip space. Vertices that fall outside of the view frustum will be removed.
            {
                Rngon.ngon.transform(cachedNgon, clipSpaceMatrix);

                if (Rngon.internalState.applyViewportClipping)
                {
                    Rngon.ngon.clip_to_viewport(cachedNgon);
                }

                // If there are no vertices left after clipping, it means this n-gon is
                // not visible on the screen at all, and so we don't need to consider it
                // for rendering.
                if (!cachedNgon.vertices.length)
                {
                    ngonCache.count--;
                    continue;
                }
            }

            // Screen space. Vertices will be transformed such that their XY coordinates
            // map directly into XY pixel coordinates in the rendered image (although
            // the values may still be in floating-point).
            {
                Rngon.ngon.transform(cachedNgon, screenSpaceMatrix);
                Rngon.ngon.perspective_divide(cachedNgon);
            }
        }
    };

    // Mark as inactive any cached n-gons that we didn't touch, so the renderer knows
    // to ignore them for the current frame.
    for (let i = ngonCache.count; i < ngonCache.ngons.length; i++)
    {
        ngonCache.ngons[i].isActive = false;
    }

    return;
}

Rngon.ngon_transform_and_light.apply_lighting = function(ngon)
{
    // Pre-allocate a vector object to operate on, so we don't need to create one repeatedly.
    const lightDirection = Rngon.vector3();

    let faceShade = ngon.material.ambientLightLevel;
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].shade = ngon.material.ambientLightLevel;
    }

    // Get the average XYZ point on this n-gon's face.
    let faceX = 0, faceY = 0, faceZ = 0;
    if (ngon.material.vertexShading === "flat")
    {
        for (const vertex of ngon.vertices)
        {
            faceX += vertex.x;
            faceY += vertex.y;
            faceZ += vertex.z;
        }

        faceX /= ngon.vertices.length;
        faceY /= ngon.vertices.length;
        faceZ /= ngon.vertices.length;
    }

    // Find the brightest shade falling on this n-gon.
    for (const light of Rngon.internalState.lights)
    {
        // If we've already found the maximum brightness, we don't need to continue.
        //if (shade >= 255) break;

        if (ngon.material.vertexShading === "gouraud")
        {
            for (let v = 0; v < ngon.vertices.length; v++)
            {
                const vertex = ngon.vertices[v];

                const distance = Math.sqrt(((vertex.x - light.position.x) * (vertex.x - light.position.x)) +
                                           ((vertex.y - light.position.y) * (vertex.y - light.position.y)) +
                                           ((vertex.z - light.position.z) * (vertex.z - light.position.z)));

                const distanceMul = (1 / (1 + (light.attenuation * distance)));

                lightDirection.x = (light.position.x - vertex.x);
                lightDirection.y = (light.position.y - vertex.y);
                lightDirection.z = (light.position.z - vertex.z);
                Rngon.vector3.normalize(lightDirection);

                const shadeFromThisLight = Math.max(0, Math.min(1, Rngon.vector3.dot(ngon.vertexNormals[v], lightDirection)));

                vertex.shade = Math.max(vertex.shade, Math.min(light.clip, (shadeFromThisLight * distanceMul * light.intensity)));
            }
        }
        else if (ngon.material.vertexShading === "flat")
        {
            const distance = Math.sqrt(((faceX - light.position.x) * (faceX - light.position.x)) +
                                       ((faceY - light.position.y) * (faceY - light.position.y)) +
                                       ((faceZ - light.position.z) * (faceZ - light.position.z)));

            const distanceMul = (1 / (1 + (light.attenuation * distance)));

            lightDirection.x = (light.position.x - faceX);
            lightDirection.y = (light.position.y - faceY);
            lightDirection.z = (light.position.z - faceZ);
            Rngon.vector3.normalize(lightDirection);

            const shadeFromThisLight = Math.max(0, Math.min(1, Rngon.vector3.dot(ngon.normal, lightDirection)));

            faceShade = Math.max(faceShade, Math.min(light.clip, (shadeFromThisLight * distanceMul * light.intensity)));
        }
        else
        {
            Rngon.throw("Unknown shading mode.");
        }
    }

    if (ngon.material.vertexShading === "flat")
    {
        for (let v = 0; v < ngon.vertices.length; v++)
        {
            ngon.vertices[v].shade = faceShade;
        }
    }

    return;
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Renders the given meshes onto a given DOM <canvas> element. Note that the target element
// must already exist.
Rngon.render = function(canvasElement,
                        meshes = [Rngon.mesh()],
                        options = {})
{
    const renderCallInfo = Rngon.renderShared.setup_render_call_info();

    // The canvas element can be passed in in a couple of ways, e.g. as a string that
    // identifies the DOM element, or directly as a DOM element object. So let's figure
    // out what we received, and turn it into a DOM element object for the renderer
    // to operate on.
    {
        if (typeof canvasElement == "string")
        {
            canvasElement = document.getElementById(canvasElement);
        }
        else if (!(canvasElement instanceof Element))
        {
            Rngon.throw("Invalid canvas element.");
        }
    }

    options = Object.freeze({
        ...Rngon.renderShared.defaultRenderOptions,
        ...options
    });
    
    Rngon.renderShared.initialize_internal_render_state(options);
    
    // Render a single frame onto the target <canvas> element.
    {
        const renderSurface = Rngon.surface(canvasElement, options);

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (renderSurface &&
            (!options.hibernateWhenNotOnScreen || renderSurface.is_in_view()))
        {
            renderSurface.display_meshes(meshes);

            renderCallInfo.renderWidth = renderSurface.width;
            renderCallInfo.renderHeight = renderSurface.height;
            renderCallInfo.numNgonsRendered = Rngon.internalState.ngonCache.count;
        }
    }

    renderCallInfo.totalRenderTimeMs = (performance.now() - renderCallInfo.totalRenderTimeMs);

    return renderCallInfo;
};
/*
 * 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

// Renders a single frame of the given meshes into an off-screen buffer (no
// dependency on the DOM, unlike Rngon.render() which renders into a <canvas>).
//
// The rendering is non-blocking and will be performed in a Worker thread.
//
// Returns a Promise that resolves with the following object:
//
//     {
//         image: <the rendered image as an ImageData object>,
//         renderWidth: <width of the rendered image>,
//         renderHeight: <height of the rendered image>,
//         totalRenderTimeMs: <number of milliseconds taken by the rendering>,
//     }
//
// On error, the Promise rejects with a string describing the error in plain language.
//
Rngon.render_async = function(meshes = [Rngon.mesh()],
                              options = {},
                              rngonUrl = null)
{
    // Modules are not supported by the async renderer.
    options.modules = {
        ngonFill: null,
        transformClipLight: null,
    };

    return new Promise((resolve, reject)=>
    {
        // Spawn a new render worker with the render_worker() function as its body.
        const workerThread = new Worker(URL.createObjectURL(new Blob([`(${render_worker.toString()})()`],
        {
            type: 'text/javascript',
        })));

        // Listen for messages from the worker.
        workerThread.onmessage = (message)=>
        {
            // For now, we assume that the worker will only send one message: either that
            // it's finished rendering, or that something went wrong. So once we've received
            // this first message, the worker has done its thing, and we can terminate it.
            workerThread.terminate();

            message = message.data;

            if (typeof message.type !== "string")
            {
                reject("A render worker sent an invalid message.");

                return;
            }

            switch (message.type)
            {
                case "rendering-finished":
                {
                    // Remove properties that we don't need to report back.
                    delete message.type;

                    resolve(message);

                    break;
                } 
                case "error":
                {
                    reject(`A render worker reported the following error: ${message.errorText}`);

                    break;
                } 
                default:
                {
                    reject("A render worker sent an unrecognized message.");
                    
                    break;
                }
            }
        }

        if (rngonUrl === null)
        {
            rngonUrl = Array.from(document.getElementsByTagName("script")).filter(e=>e.src.endsWith("rngon.cat.js"))[0].src;
        }

        // Tell the worker to render the given meshes.
        workerThread.postMessage({
            type: "render",
            meshes,
            options,
            rngonUrl,
        });
    });

    // The function we'll run as a Worker thread to perform the rendering.
    //
    // To ask this function to render an array of Rngon.mesh() objects into an off-screen
    // pixel buffer, post to it the following message, via postMessage():
    //
    //     {
    //         type: "render",
    //         meshes: [<your mesh array>],
    //         options: {<options to Rngon.render()},
    //         rngonUrl: `${window.location.origin}/distributable/rngon.cat.js`,
    //     }
    //
    // On successful completion of the rendering, the function will respond with the
    // following message, via postMessage():
    //
    //     {
    //         type: "rendering-finished",
    //         image: <the rendered image as an ImageData object>,
    //         renderWidth: <width of the rendered image>,
    //         renderHeight: <height of the rendered image>,
    //         totalRenderTimeMs: <number of milliseconds taken by the rendering>,
    //     }
    //
    // On error, the function will respond with the following message, via postMessage():
    //
    //     {
    //         type: "error",
    //         errorText: <a string describing the error in plain language>,
    //     }
    // 
    function render_worker()
    {
        onmessage = (message)=>
        {
            message = message.data;

            if (typeof message.type !== "string")
            {
                postMessage({
                    type: "error",
                    errorText: "A render worker received an invalid message.",
                });

                return;
            }

            switch (message.type)
            {
                // Render the meshes provided in the message, and in return postMessage() the
                // resulting pixel buffer.
                case "render":
                {
                    try
                    {
                        importScripts(message.rngonUrl);
                        render(message.meshes, message.options);
                    }
                    catch (error)
                    {
                        postMessage({
                            type: "error",
                            errorText: error.message,
                        });
                    }

                    break;
                }
                default:
                {
                    postMessage({
                        type: "error",
                        errorText: "Received an unrecognized message.",
                    });
                    
                    break;
                }
            }
        };

        // Renders the given meshes into the internal pixel buffer, Rngon.internalState.pixelBuffer.
        function render(meshes, renderOptions)
        {
            if (!Array.isArray(meshes))
            {
                Rngon.throw("Expected meshes to be provided in an array.");
                
                return;
            }

            const renderCallInfo = Rngon.renderShared.setup_render_call_info();

            const options = Object.freeze({
                ...Rngon.renderShared.defaultRenderOptions,
                ...renderOptions,
            });
            
            Rngon.renderShared.initialize_internal_render_state(options);

            // Disable the use of window.alert() while inside a Worker.
            Rngon.internalState.allowWindowAlert = false;
            
            // Render a single frame.
            {
                const renderSurface = Rngon.surface(null, options);
        
                if (renderSurface)
                {
                    renderSurface.display_meshes(meshes);

                    renderCallInfo.renderWidth = options.width;
                    renderCallInfo.renderHeight = options.height;
                    renderCallInfo.numNgonsRendered = Rngon.internalState.ngonCache.count;
                    renderCallInfo.image = Rngon.internalState.pixelBuffer;
                }
                else
                {
                    Rngon.throw("Failed to initialize the render surface.");

                    return;
                }
            }
        
            renderCallInfo.totalRenderTimeMs = (performance.now() - renderCallInfo.totalRenderTimeMs);

            postMessage({
                ...renderCallInfo,
                type: "rendering-finished",
            });

            return;
        }

        return;
    }
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Functionality that may be shared between different implementations of Rngon.render()
// and perhaps called by other subsystems, like Rngon.surface().
Rngon.renderShared = {
    // The 'options' object is a reference to or copy of the options passed to render().
    initialize_internal_render_state: function(options = {})
    {
        const state = Rngon.internalState;
        
        state.useDepthBuffer = Boolean(options.useDepthBuffer);
        state.showGlobalWireframe = Boolean(options.globalWireframe);
        state.applyViewportClipping = Boolean(options.clipToViewport);
        state.lights = options.lights;
        state.farPlaneDistance = options.farPlane;

        state.usePerspectiveCorrectInterpolation = Boolean((options.perspectiveCorrectTexturing || // <- Name in pre-beta.2.
                                                            options.perspectiveCorrectInterpolation));

        state.useVertexShader = Boolean(options.vertexShader);
        state.vertex_shader = options.vertexShader;

        state.usePixelShader = Boolean(options.pixelShader);
        state.pixel_shader = (options.shaderFunction || // <- Name in pre-beta.3.
                              options.pixelShader); 

        state.modules.ngon_fill = (options.modules.ngonFill || Rngon.ngon_filler);
        state.modules.transform_clip_light = (options.modules.transformClipLight || Rngon.ngon_transform_and_light)
        state.modules.surface_wipe = (options.modules.surfaceWipe || Rngon.surface.wipe);

        return;
    },

    // Creates or resizes the n-gon cache to fit at least the number of n-gons contained
    // in the given array of meshes.
    prepare_ngon_cache: function(meshes = [])
    {
        Rngon.assert && (meshes instanceof Array)
                     || Rngon.throw("Invalid arguments to n-gon cache initialization.");

        const ngonCache = Rngon.internalState.ngonCache;
        const sceneNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

        if (!ngonCache ||
            !ngonCache.ngons.length ||
            (ngonCache.ngons.length < sceneNgonCount))
        {
            const lengthDelta = (sceneNgonCount - ngonCache.ngons.length);

            ngonCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Rngon.ngon()));
        }

        ngonCache.count = 0;

        return;
    },

    // Sorts all vertices in the n-gon cache by their Z coordinate.
    depth_sort_ngon_cache: function(depthSortinMode = "")
    {
        const ngons = Rngon.internalState.ngonCache.ngons;

        switch (depthSortinMode)
        {
            case "none": break;

            // Painter's algorithm. Sort back-to-front; i.e. so that n-gons furthest from the camera
            // will be first in the list.
            case "painter":
            {
                ngons.sort((ngonA, ngonB)=>
                {
                    // Separate inactive n-gons (which are to be ignored when rendering the current
                    // frame) from the n-gons we're intended to render.
                    const a = (ngonA.isActive? (ngonA.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonA.vertices.length) : -Number.MAX_VALUE);
                    const b = (ngonB.isActive? (ngonB.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonB.vertices.length) : -Number.MAX_VALUE);

                    return ((a === b)? 0 : ((a < b)? 1 : -1));
                });

                break;
            }
            
            // Sort front-to-back; i.e. so that n-gons closest to the camera will be first in the
            // list. When used together with depth buffering, allows for early rejection of occluded
            // pixels during rasterization.
            case "painter-reverse":
            default:
            {
                ngons.sort((ngonA, ngonB)=>
                {
                    // Separate inactive n-gons (which are to be ignored when rendering the current
                    // frame) from the n-gons we're intended to render.
                    const a = (ngonA.isActive? (ngonA.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonA.vertices.length) : Number.MAX_VALUE);
                    const b = (ngonB.isActive? (ngonB.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonB.vertices.length) : Number.MAX_VALUE);

                    return ((a === b)? 0 : ((a > b)? 1 : -1));
                });

                break;
            }
        }

        return;
    },

    // Marks any non-power-of-two affine-mapped faces in the n-gon cache as using the
    // non-power-of-two affine texture mapper. This needs to be done since the default
    // affine mapper expects textures to be power-of-two.
    mark_npot_textures_in_ngon_cache: function()
    {
        for (let i = 0; i < Rngon.internalState.ngonCache.count; i++)
        {
            const ngon = Rngon.internalState.ngonCache.ngons[i];

            if (ngon.material.texture &&
                ngon.material.textureMapping === "affine")
            {
                let widthIsPOT = ((ngon.material.texture.width & (ngon.material.texture.width - 1)) === 0);
                let heightIsPOT = ((ngon.material.texture.height & (ngon.material.texture.height - 1)) === 0);

                if (ngon.material.texture.width === 0) widthIsPOT = false;
                if (ngon.material.texture.height === 0) heightIsPOT = false;

                if (!widthIsPOT || !heightIsPOT)
                {
                    ngon.material.textureMapping = "affine-npot";
                }
            }
        }

        return;
    },

    // (See the root README.md for documentation on these parameters.)
    defaultRenderOptions: Object.freeze({
        cameraPosition: Rngon.vector3(0, 0, 0),
        cameraDirection: Rngon.vector3(0, 0, 0),
        pixelShader: null, // If null, all pixel shader functionality will be disabled.
        vertexShader: null, // If null, all vertex shader functionality will be disabled.
        scale: 1,
        fov: 43,
        nearPlane: 1,
        farPlane: 1000,
        depthSort: "", // An empty string will make the renderer use its default depth sort option.
        useDepthBuffer: true,
        clipToViewport: true,
        globalWireframe: false,
        hibernateWhenNotOnScreen: true,
        perspectiveCorrectInterpolation: false,
        auxiliaryBuffers: [],
        lights: [],
        width: 640, // Used by render_async() only.
        height: 480, // Used by render_async() only.
        modules: {
            ngonFill: null, // Null defaults to Rngon.ngon_filler.
            transformClipLight: null, // Null defaults to Rngon.ngon_transform_and_light.
        },
    }),

    // Returns an object containing the properties - and their defualt starting values -
    // that a call to render() should return.
    setup_render_call_info: function()
    {
        return {
            renderWidth: 0,
            renderHeight: 0,

            // The total count of n-gons rendered. May be smaller than the number of n-gons
            // originally submitted for rendering, due to visibility culling etc. performed
            // during the rendering process.
            numNgonsRendered: 0,

            // The total time this call to render() took, in milliseconds.
            totalRenderTimeMs: performance.now(),
        };
    },
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// A 32-bit texture.
Rngon.texture_rgba = function(data = {})
{
    // Append default parameter arguments.
    data =
    {
        ...{
            width: 0,
            height: 0,
            pixels: [],
            encoding: "none",
            channels: "rgba:8+8+8+8",
            needsFlip: true,
        },
        ...data,
    }

    // The maximum dimensions of a texture.
    const maxWidth = 32768;
    const maxHeight = 32768;

    const numColorChannels = 4;

    Rngon.assert && (Number.isInteger(data.width) && Number.isInteger(data.height))
                 || Rngon.throw("Expected texture width and height to be integer values.");
    Rngon.assert && (data.width >= 0 && data.height >= 0)
                 || Rngon.throw("Expected texture width and height to be no less than zero.");
    Rngon.assert && (data.width <= maxWidth && data.height <= maxHeight)
                 || Rngon.throw("Expected texture width/height to be no more than " + maxWidth + "/" + maxHeight + ".");

    // If necessary, decode the pixel data into raw RGBA/8888.
    if (data.encoding !== "none")
    {
        // In Base64-encoded data, each pixel's RGBA is expected to be given as a 16-bit
        // value, where each of the RGB channels takes up 5 bits and the alpha channel
        // 1 bit.
        if (data.encoding === "base64")
        {
            Rngon.assert && (data.channels === "rgba:5+5+5+1")
                         || Rngon.throw("Expected Base64-encoded data to be in RGBA 5551 format.");

            data.pixels = (()=>
            {
                const rgba = [];
                const decoded = atob(data.pixels);

                // We should have an array where each pixel is a 2-byte value.
                Rngon.assert && (decoded.length === (data.width * data.height * 2))
                             || Rngon.throw("Unexpected data length for a Base64-encoded texture.");

                for (let i = 0; i < (data.width * data.height * 2); i += 2)
                {
                    const p = (decoded.charCodeAt(i) | (decoded.charCodeAt(i+1)<<8));

                    rgba.push((p         & 0x1f) * 8);  // Red.
                    rgba.push(((p >> 5)  & 0x1f) * 8);  // Green.
                    rgba.push(((p >> 10) & 0x1f) * 8);  // Blue.
                    rgba.push(((p >> 15) & 1) * 255);   // Alpha.
                }

                return rgba;
            })();
        }
        else if (data.encoding !== "none")
        {
            Rngon.throw("Unknown texture data encoding '" + data.encoding + "'.");
        }
    }

    Rngon.assert && (data.pixels.length === (data.width * data.height * numColorChannels))
                 || Rngon.throw("The texture's pixel array size doesn't match its width and height.");

    // Convert the raw pixel data into objects of the form {red, green, blue, alpha}.
    // Note: We also flip the texture on the Y axis, to counter the fact that textures
    // become flipped on Y during rendering (i.e. we pre-emptively un-flip it, here).
    const pixelArray = [];
    for (let y = 0; y < data.height; y++)
    {
        for (let x = 0; x < data.width; x++)
        {
            const idx = ((x + (data.needsFlip? (data.height - y - 1) : y) * data.width) * numColorChannels);

            pixelArray.push({red:   data.pixels[idx + 0],
                             green: data.pixels[idx + 1],
                             blue:  data.pixels[idx + 2],
                             alpha: data.pixels[idx + 3]});
        }
    }

    // Generate mipmaps. Each successive mipmap is one half of the previous
    // mipmap's width and height, starting from the full resolution and working
    // down to 1 x 1. So mipmaps[0] is the original, full-resolution texture,
    // and mipmaps[mipmaps.length-1] is the smallest, 1 x 1 texture.
    const mipmaps = [];
    for (let m = 0; ; m++)
    {
        const mipWidth = Math.max(1, Math.floor(data.width / Math.pow(2, m)));
        const mipHeight = Math.max(1, Math.floor(data.height / Math.pow(2, m)));

        // Downscale the texture image to the next mip level.
        const mipPixelData = [];
        {
            const deltaW = (data.width / mipWidth);
            const deltaH = (data.height / mipHeight);
    
            for (let y = 0; y < mipHeight; y++)
            {
                for (let x = 0; x < mipWidth; x++)
                {
                    const dstIdx = (x + y * mipWidth);
                    const srcIdx = (Math.floor(x * deltaW) + Math.floor(y * deltaH) * data.width);

                    mipPixelData[dstIdx] = pixelArray[srcIdx];
                }
            }
        }

        mipmaps.push({
            width: mipWidth,
            height: mipHeight,
            pixels: mipPixelData,
        });

        // We're finished generating mip levels once we've done them down to 1 x 1.
        if ((mipWidth === 1) && (mipHeight === 1))
        {
            Rngon.assert && (mipmaps.length > 0)
                         || Rngon.throw("Failed to generate mip levels for a texture.");
                         
            break;
        }
    }

    const publicInterface =
    {
        width: data.width,
        height: data.height,
        pixels: pixelArray,
        mipLevels: mipmaps,
    };
    
    return publicInterface;
}


// Returns a new texture whose data are a deep copy of the given texture.
Rngon.texture_rgba.deep_copy = function(texture)
{
    const copiedPixels = new Array(texture.width * texture.height * 4);

    for (let i = 0; i< (texture.width * texture.height); i++)
    {
        copiedPixels[i*4+0] = texture.pixels[i].red;
        copiedPixels[i*4+1] = texture.pixels[i].green;
        copiedPixels[i*4+2] = texture.pixels[i].blue;
        copiedPixels[i*4+3] = texture.pixels[i].alpha;
    }

    return Rngon.texture_rgba({
       width: texture.width,
       height: texture.height,
       pixels: copiedPixels,
       needsFlip: false,
    });
}

// Returns a Promise of a texture whose data is loaded from the given file. The actual
// texture is returned once the data has been loaded.
// Note: Only supports JSON files at the moment, expecting them to contain a valid
// object to be passed as-is into texture_rgba().
Rngon.texture_rgba.create_with_data_from_file = function(filename)
{
    return new Promise((resolve, reject)=>
    {
        fetch(filename)
        .then((response)=>response.json())
        .then((data)=>
        {
            resolve(Rngon.texture_rgba(data));
        })
        .catch((error)=>{Rngon.throw("Failed to create a texture with data from file '" + filename + "'. Error: '" + error + "'.")});
    });
}
/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A surface for rendering onto. Will also paint the rendered image onto a HTML5 <canvas>
// element unless the 'canvasElementId' parameter is null, in which case rendering will be
// to an off-screen buffer only.
//
// Returns null if the surface could not be created.
Rngon.surface = function(canvasElement,  // The target DOM <canvas> element.
                         options = {})   // A reference to or copy of the options passed to render().
{
    const renderOffscreen = Boolean(canvasElement === null);

    let surfaceWidth = undefined,
        surfaceHeight = undefined,
        renderContext = undefined;

    try
    {
        if (renderOffscreen)
        {
            ({surfaceWidth, surfaceHeight} = setup_offscreen(options.width, options.height));
        }
        else
        {
            ({surfaceWidth,
              surfaceHeight,
              canvasElement,
              renderContext} = setup_onscreen(canvasElement, options.scale));
        }
        
        initialize_internal_surface_state(surfaceWidth, surfaceHeight);
    }
    catch (error)
    {
        Rngon.log(`Failed to create a render surface. ${error}`);
        return null;
    }

    const cameraMatrix = Rngon.matrix44.multiply(Rngon.matrix44.rotation(options.cameraDirection.x,
                                                                         options.cameraDirection.y,
                                                                         options.cameraDirection.z),
                                                 Rngon.matrix44.translation(-options.cameraPosition.x,
                                                                            -options.cameraPosition.y,
                                                                            -options.cameraPosition.z));
    const perspectiveMatrix = Rngon.matrix44.perspective((options.fov * Math.PI/180),
                                                         (surfaceWidth / surfaceHeight),
                                                         options.nearPlane,
                                                         options.farPlane);
    const screenSpaceMatrix = Rngon.matrix44.ortho((surfaceWidth + 1), (surfaceHeight + 1));

    const publicInterface = Object.freeze(
    {
        width: surfaceWidth,
        height: surfaceHeight,

        // Rasterizes the given meshes' n-gons onto this surface. Following this call,
        // the rasterized pixels will be in Rngon.internalState.pixelBuffer, and the
        // meshes' n-gons - with their vertices transformed to screen space - in
        // Rngon.internalState.ngonCache. If a <canvas> element id was specified for
        // this surface, the rasterized pixels will also be painted onto that canvas.
        display_meshes: function(meshes = [])
        {
            Rngon.internalState.modules.surface_wipe();

            // Prepare the meshes' n-gons for rendering. This will place the transformed
            // n-gons into the internal n-gon cache, Rngon.internalState.ngonCache.
            {
                Rngon.renderShared.prepare_ngon_cache(meshes);

                for (const mesh of meshes)
                {
                    Rngon.internalState.modules.transform_clip_light(
                        mesh.ngons,
                        Rngon.mesh.object_space_matrix(mesh),
                        cameraMatrix,
                        perspectiveMatrix,
                        screenSpaceMatrix,
                        options.cameraPosition);
                };

                Rngon.renderShared.mark_npot_textures_in_ngon_cache();
                Rngon.renderShared.depth_sort_ngon_cache(options.depthSort);
            }

            // Render the n-gons from the n-gon cache. The rendering will go into the
            // renderer's internal pixel buffer, Rngon.internalState.pixelBuffer.
            {
                Rngon.internalState.modules.ngon_fill(options.auxiliaryBuffers);

                if (Rngon.internalState.usePixelShader)
                {
                    const args = {
                        renderWidth: surfaceWidth,
                        renderHeight: surfaceHeight,
                        fragmentBuffer: Rngon.internalState.fragmentBuffer.data,
                        pixelBuffer: Rngon.internalState.pixelBuffer.data,
                        ngonCache: Rngon.internalState.ngonCache.ngons,
                        cameraPosition: options.cameraPosition,
                    };

                    const paramNamesString = `{${Object.keys(args).join(",")}}`;

                    switch (typeof Rngon.internalState.pixel_shader)
                    {
                        case "function":
                        {
                            Rngon.internalState.pixel_shader(args);
                            break;
                        }
                        // Shader functions as strings are supported to allow shaders to be
                        // used in Web Workers. These strings are expected to be of - or
                        // equivalent to - the form "(a)=>{console.log(a)}".
                        case "string":
                        {
                            Function(paramNamesString, `(${Rngon.internalState.pixel_shader})(${paramNamesString})`)(args);
                            break;
                        }
                        default:
                        {
                            Rngon.throw("Unrecognized type of pixel shader function.");
                            break;
                        }
                    }
                }

                if (!renderOffscreen)
                {
                    renderContext.putImageData(Rngon.internalState.pixelBuffer, 0, 0);
                }
            }
        },

        // Returns true if any horizontal part of the surface's DOM canvas is within
        // the page's visible region.
        is_in_view: function()
        {
            // Offscreen rendering is always 'in view' in the sense that it doesn't
            // have a physical manifestation in the DOM that could go out of view to
            // begin with. Technically this could maybe be made to return false to
            // indicate that the offscreen buffer is for some reason uinavailable,
            // but for now we don't do that.
            if (renderOffscreen)
            {
                return true;
            }

            const viewHeight = window.innerHeight;
            const containerRect = canvasElement.getBoundingClientRect();

            return Boolean((containerRect.top > -containerRect.height) &&
                           (containerRect.top < viewHeight));
        },
    });

    return publicInterface;

    // Initializes the internal render buffers if they're not already in a
    // suitable state.
    function initialize_internal_surface_state(surfaceWidth, surfaceHeight)
    {
        if ((Rngon.internalState.pixelBuffer.width != surfaceWidth) ||
            (Rngon.internalState.pixelBuffer.height != surfaceHeight))
        {
            Rngon.internalState.pixelBuffer = new ImageData(surfaceWidth, surfaceHeight);
        }

        if ( Rngon.internalState.usePixelShader &&
            (Rngon.internalState.fragmentBuffer.width != surfaceWidth) ||
            (Rngon.internalState.fragmentBuffer.height != surfaceHeight))
        {
            Rngon.internalState.fragmentBuffer.width = surfaceWidth;
            Rngon.internalState.fragmentBuffer.height = surfaceHeight;
            Rngon.internalState.fragmentBuffer.data = new Array(surfaceWidth * surfaceHeight)
                                                      .fill()
                                                      .map(e=>({}));
        }

        if ( Rngon.internalState.useDepthBuffer &&
            (Rngon.internalState.depthBuffer.width != surfaceWidth) ||
            (Rngon.internalState.depthBuffer.height != surfaceHeight) ||
            !Rngon.internalState.depthBuffer.data.length)
        {
            Rngon.internalState.depthBuffer.width = surfaceWidth;
            Rngon.internalState.depthBuffer.height = surfaceHeight;
            Rngon.internalState.depthBuffer.data = new Array(Rngon.internalState.depthBuffer.width *
                                                             Rngon.internalState.depthBuffer.height); 
        }

        return;
    }

    // Initializes the target DOM <canvas> element for rendering into. Throws on errors.
    function setup_onscreen(canvasElement, scale)
    {
        Rngon.assert && (canvasElement instanceof Element)
                     || Rngon.throw("Can't find the given canvas element.");

        const renderContext = canvasElement.getContext("2d");

        Rngon.assert && (renderContext instanceof CanvasRenderingContext2D)
                     || Rngon.throw("Couldn't establish a canvas render context.");

        // Size the canvas as per the requested render scale.
        const surfaceWidth = Rngon.renderable_width_of(canvasElement, scale);
        const surfaceHeight = Rngon.renderable_height_of(canvasElement, scale);
        {
            Rngon.assert && ((surfaceWidth > 0) &&
                             (surfaceHeight > 0))
                         || Rngon.throw("Couldn't retrieve the canvas's dimensions.");

            canvasElement.setAttribute("width", surfaceWidth);
            canvasElement.setAttribute("height", surfaceHeight);
        }

        return {
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            renderContext};
    }

    // Sets up rendering into an off-screen buffer, i.e. without using a DOM <canvas>
    // element. Right now, since the renderer by default renders into an off-screen
    // buffer first and then transfers the pixels onto a <canvas>, this function
    // is more about just skipping initialization of the <canvas> element.
    //
    // Note: This function should throw on errors.
    function setup_offscreen(width, height)
    {
        return {
            surfaceWidth: width,
            surfaceHeight: height,
        };
    }
}

// Resets the surface's render buffers to their initial contents.
Rngon.surface.wipe = function()
{
    Rngon.internalState.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (Rngon.internalState.useDepthBuffer)
    {
        Rngon.internalState.depthBuffer.data.fill(Rngon.internalState.depthBuffer.clearValue);
    }

    return;
}
