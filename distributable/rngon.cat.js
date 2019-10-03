// WHAT: Concatenated JavaScript source files
// PROGRAM: Retro n-gon renderer
// VERSION: live (03 October 2019 15:12:54 UTC)
// AUTHOR: Tarpeeksi Hyvae Soft and others
// LINK: https://www.github.com/leikareipa/retro-ngon/
// FILES:
//	../js/retro-ngon/retro-ngon.js
//	../js/retro-ngon/trig.js
//	../js/retro-ngon/color.js
//	../js/retro-ngon/geometry.js
//	../js/retro-ngon/line-draw.js
//	../js/retro-ngon/matrix44.js
//	../js/retro-ngon/ngon-fill.js
//	../js/retro-ngon/render.js
//	../js/retro-ngon/transform.js
//	../js/retro-ngon/texture.js
//	../js/retro-ngon/screen.js
/////////////////////////////////////////////////

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

    applyViewportClipping: true,

    // All transformed n-gons on a particular call to render() will be placed here.
    // The cache size will be dynamically adjusted up to match the largest number
    // of transformed n-gons, so at any given time the number of active n-gons (those
    // that have been transformed for the current frame) may be smaller than the
    // cache's total capacity.
    transformedNgonsCache: {numActiveNgons:0, ngons:[]},
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

        // Returns the color as a "#rrggbbaa" string. You can mask out a particular color
        // channel by providing a bitmask where the corresponding bits are zero. For instance,
        // to mask out the alpha channel and return "#rrggbb", provide the mask 0x1110. When
        // masking out any channel but alpha, the corresponding channel(s) will be set to
        // "00"; e.g. [255,255,255,255](0x1010) -> "#ff00ff".
        as_hex: (channelMask = 0x1111)=>
        {
            const hex_value = (value)=>(((value < 10)? "0" : "") + value.toString(16));
            return ("#"
                    + ((channelMask & 0x1000)? hex_value(red)   : "00")
                    + ((channelMask & 0x0100)? hex_value(green) : "00")
                    + ((channelMask & 0x0010)? hex_value(blue)  : "00")
                    + ((channelMask & 0x0001)? hex_value(alpha) : ""));
        },
    });
    return publicInterface;
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 * Functions to do with space; like vectors, vertices, etc.
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

        // Transforms the vector by the given 4x4 matrix.
        transform: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                            || Rngon.throw("Expected a 4 x 4 matrix to transform the vector by.");
            
            const x_ = ((m[0] * this.x) + (m[4] * this.y) + (m[ 8] * this.z));
            const y_ = ((m[1] * this.x) + (m[5] * this.y) + (m[ 9] * this.z));
            const z_ = ((m[2] * this.x) + (m[6] * this.y) + (m[10] * this.z));

            this.x = x_;
            this.y = y_;
            this.z = z_;
        },

        normalize: function()
        {
            const sn = ((this.x * this.x) + (this.y * this.y) + (this.z * this.z));

            if (sn != 0 && sn != 1)
            {
                const inv = (1 / Math.sqrt(sn));
                this.x *= inv;
                this.y *= inv;
                this.z *= inv;
            }
        },

        dot: function(other)
        {
            return ((this.x * other.x) + (this.y * other.y) + (this.z * other.z));
        }
    };

    return returnObject;
}

// Convenience aliases for vector3.
Rngon.translation_vector = Rngon.vector3;
Rngon.rotation_vector = (x, y, z)=>Rngon.vector3(Rngon.trig.deg(x), Rngon.trig.deg(y), Rngon.trig.deg(z));
Rngon.scaling_vector = Rngon.vector3;

// NOTE: The returned object is not immutable.
Rngon.vertex = function(x = 0, y = 0, z = 0, u = 0, v = 0, w = 1)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number" &&
                     typeof w === "number" && typeof u === "number" && typeof v === "number")
                 || Rngon.throw("Expected numbers as parameters to the vertex factory.");

    const returnObject =
    {
        x,
        y,
        z,
        u,
        v,
        w,

        // Transforms the vertex by the given 4x4 matrix.
        transform: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                         || Rngon.throw("Expected a 4 x 4 matrix to transform the vertex by.");
            
            const x_ = ((m[0] * this.x) + (m[4] * this.y) + (m[ 8] * this.z) + (m[12] * this.w));
            const y_ = ((m[1] * this.x) + (m[5] * this.y) + (m[ 9] * this.z) + (m[13] * this.w));
            const z_ = ((m[2] * this.x) + (m[6] * this.y) + (m[10] * this.z) + (m[14] * this.w));
            const w_ = ((m[3] * this.x) + (m[7] * this.y) + (m[11] * this.z) + (m[15] * this.w));

            this.x = x_;
            this.y = y_;
            this.z = z_;
            this.w = w_;
        },

        // Applies perspective division to the vertex.
        perspective_divide: function()
        {
            this.x /= this.w;
            this.y /= this.w;
            this.z /= this.w;
        }
    };

    return returnObject;
}

// A single n-sided ngon.
// NOTE: The return object is not immutable.
Rngon.ngon = function(vertices = [Rngon.vertex()], material = {}, normal = Rngon.vector3(0, 1, 0))
{
    Rngon.assert && (vertices instanceof Array) || Rngon.throw("Expected an array of vertices to make an ngon.");
    Rngon.assert && (material instanceof Object) || Rngon.throw("Expected an object containing user-supplied options.");

    Rngon.assert && (typeof Rngon.ngon.defaultMaterial.color !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.texture !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasSolidFill !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasWireframe !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.wireframeColor !== "undefined")
                 || Rngon.throw("The default material object for ngon() is missing required properties.");

    // Combine default material options with the user-supplied ones.
    material =
    {
        ...Rngon.ngon.defaultMaterial,
        ...material
    };

    const returnObject =
    {
        vertices,
        material,
        normal,

        // Clips all vertices against the sides of the viewport. Adapted from Benny
        // Bobaganoosh's 3d software renderer, the source for which is available at
        // https://github.com/BennyQBD/3DSoftwareRenderer.
        clip_to_viewport: function()
        {
            clip_on_axis.call(this, "x", 1);
            clip_on_axis.call(this, "x", -1);
            clip_on_axis.call(this, "y", 1);
            clip_on_axis.call(this, "y", -1);
            clip_on_axis.call(this, "z", 1);
            clip_on_axis.call(this, "z", -1);

            return;

            function clip_on_axis(axis, factor)
            {
                if (!this.vertices.length)
                {
                    return;
                }

                let prevVertex = this.vertices[this.vertices.length - 1];
                let prevComponent = prevVertex[axis] * factor;
                let isPrevVertexInside = (prevComponent <= prevVertex.w);
                
                // The vertices array will be modified in-place by appending the clipped vertices
                // onto the end of the array, then removing the previous ones.
                let k = 0;
                let numOriginalVertices = this.vertices.length;
                for (let i = 0; i < numOriginalVertices; i++)
                {
                    const curComponent = this.vertices[i][axis] * factor;
                    const isThisVertexInside = (curComponent <= this.vertices[i].w);

                    // If either the current vertex or the previous vertex is inside but the other isn't,
                    // and they aren't both inside, interpolate a new vertex between them that lies on
                    // the clipping plane.
                    if (isThisVertexInside ^ isPrevVertexInside)
                    {
                        const lerpStep = (prevVertex.w - prevComponent) /
                                          ((prevVertex.w - prevComponent) - (this.vertices[i].w - curComponent));

                        this.vertices[numOriginalVertices + k++] = Rngon.vertex(Rngon.lerp(prevVertex.x, this.vertices[i].x, lerpStep),
                                                                                Rngon.lerp(prevVertex.y, this.vertices[i].y, lerpStep),
                                                                                Rngon.lerp(prevVertex.z, this.vertices[i].z, lerpStep),
                                                                                Rngon.lerp(prevVertex.u, this.vertices[i].u, lerpStep),
                                                                                Rngon.lerp(prevVertex.v, this.vertices[i].v, lerpStep),
                                                                                Rngon.lerp(prevVertex.w, this.vertices[i].w, lerpStep))
                    }
                    
                    if (isThisVertexInside)
                    {
                        this.vertices[numOriginalVertices + k++] = this.vertices[i];
                    }

                    prevVertex = this.vertices[i];
                    prevComponent = curComponent;
                    isPrevVertexInside = isThisVertexInside;
                }

                this.vertices.splice(0, numOriginalVertices);

                return;
            }
        },

        perspective_divide: function()
        {
            for (const vert of this.vertices)
            {
                vert.perspective_divide();
            }
        },

        transform: function(matrix44)
        {
            for (const vert of this.vertices)
            {
                vert.transform(matrix44);
            }
        },
    };

    return returnObject;
}

Rngon.ngon.defaultMaterial = 
{
    color: Rngon.color_rgba(255, 255, 255, 255),
    texture: null,
    textureMapping: "ortho",
    hasSolidFill: true,
    hasWireframe: false,
    isTwoSided: true,
    wireframeColor: Rngon.color_rgba(0, 0, 0),
    auxiliary: {},
};

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
        objectSpaceMatrix: function()
        {
            const translationMatrix = Rngon.matrix44.translate(this.translation.x,
                                                               this.translation.y,
                                                               this.translation.z);

            const rotationMatrix = Rngon.matrix44.rotate(this.rotation.x,
                                                         this.rotation.y,
                                                         this.rotation.z);

            const scalingMatrix = Rngon.matrix44.scale(this.scale.x,
                                                       this.scale.y,
                                                       this.scale.z);

            return Rngon.matrix44.matrices_multiplied(Rngon.matrix44.matrices_multiplied(translationMatrix, rotationMatrix), scalingMatrix);
        },
    };
    
    return publicInterface;
}

Rngon.mesh.defaultTransform = 
{
    translation: Rngon.translation_vector(0, 0, 0),
    rotation: Rngon.rotation_vector(0, 0, 0),
    scaling: Rngon.scaling_vector(1, 1, 1)
};
"use strict";

// Provides functions for drawing lines.
Rngon.line_draw = (()=>
{
    return Object.freeze(
    {
        // Draws a line between the two given vertices into the render's pixel buffer. It's
        // expected that the pixel array packs the pixels as consecutive RGBA values, each
        // in the range 0..255. If the 'respectDepth' option is set to true, the line's pixels
        // will be tested against the depth buffer before rendering.
        into_pixel_buffer: function(vert1 = Rngon.vertex(),
                                    vert2 = Rngon.vertex(),
                                    lineColor = Rngon.color_rgba(127, 127, 127, 255),
                                    respectDepth = false)
        {
            const pixelBuffer = Rngon.internalState.pixelBuffer.data;
            const bufferWidth = Rngon.internalState.pixelBuffer.width;
            const bufferHeight = Rngon.internalState.pixelBuffer.height;

            let x0 = Math.ceil(vert1.x);
            let y0 = Math.ceil(vert1.y);
            const x1 = Math.ceil(vert2.x);
            const y1 = Math.ceil(vert2.y);

            Rngon.assert && (!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1))
                         || Rngon.throw("Invalid vertex coordinates for line-drawing.");

            const lineLength = (respectDepth? this.distanceBetween(x0, y0, x1, y1) : 1);

            // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
            {
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                const sx = ((x0 < x1)? 1 : -1);
                const sy = ((y0 < y1)? 1 : -1); 
                let err = (((dx > dy)? dx : -dy) / 2);
                
                while (1)
                {
                    const l = (respectDepth? (this.distanceBetween(x1, y1, x0, y0) / (lineLength || 1)) : 1);

                    put_pixel(x0, y0, (respectDepth? Rngon.lerp((vert2.w - 5), (vert1.w - 5), l) : 0));

                    if ((x0 === x1) && (y0 === y1)) break;

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
            }

            function put_pixel(x = 0, y = 0, depth = 0)
            {
                if (x < 0 || x >= bufferWidth ||
                   (y < 0 || y >= bufferHeight))
                {
                    return;
                }

                const idx = ((x + y * bufferWidth) * 4);

                if (respectDepth &&
                    (Rngon.internalState.depthBuffer.buffer[idx/4] <= depth))
                {
                    return;
                }

                pixelBuffer[idx + 0] = lineColor.red;
                pixelBuffer[idx + 1] = lineColor.green;
                pixelBuffer[idx + 2] = lineColor.blue;
                pixelBuffer[idx + 3] = lineColor.alpha;
            }
        },
        
        // 'Draws' a line between the two given vertices into the given array, such that
        // e.g. the coordinates 5,8 would be represented as array[8].x === 5. The yOffset
        // parameter lets you specify a value that'll be subtracted from all y coordinates
        // (i.e. from indices when writing into the array). Will interpolate the vertices'
        // u,v coordinates, as well, and place them into array[].u and array[].v.
        into_array: function(vert1 = Rngon.vertex(),
                             vert2 = Rngon.vertex(),
                             array = [],
                             yOffset = 0)
        {
            yOffset = Math.ceil(yOffset);

            let x0 = Math.ceil(vert1.x);
            let y0 = Math.ceil(vert1.y);
            const x1 = Math.ceil(vert2.x);
            const y1 = Math.ceil(vert2.y);

            Rngon.assert && (!isNaN(x0) &&
                             !isNaN(x1) &&
                             !isNaN(y0) &&
                             !isNaN(y1))
                         || Rngon.throw("Invalid vertex coordinates for line-drawing.");

            const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectTexturing;

            const lineLength = this.distanceBetween(x0, y0, x1, y1);

            // If true, we won't touch non-null elements in the array. Useful in preventing certain
            // edge-rendering errors.
            const noOverwrite = (y1 <= y0);

            // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
            {
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                const sx = ((x0 < x1)? 1 : -1);
                const sy = ((y0 < y1)? 1 : -1); 
                let err = (((dx > dy)? dx : -dy) / 2);
                
                while (1)
                {
                    // Mark the pixel into the array.
                    if (!noOverwrite || (array[y0 - yOffset] == null))
                    {
                        // Interpolate select parameters.
                        const l = (this.distanceBetween(x1, y1, x0, y0) / (lineLength || 1));
                        const pixel =
                        {
                            x: x0,
                            depth: (Rngon.internalState.useDepthBuffer? Rngon.lerp(vert2.z, vert1.z, l) : 0),
                            uvw: (interpolatePerspective? Rngon.lerp((1 / vert2.w), (1 / vert1.w), l) : 1),
                            u: (interpolatePerspective? Rngon.lerp((vert2.u / vert2.w), (vert1.u / vert1.w), l) : Rngon.lerp(vert2.u, vert1.u, l)),
                            v: (interpolatePerspective? Rngon.lerp((vert2.v / vert2.w), (vert1.v / vert1.w), l) : Rngon.lerp(vert2.v, vert1.v, l)),
                        };

                        array[y0 - yOffset] = pixel;
                    }
                    
                    if ((x0 === x1) && (y0 === y1)) break;

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
            }
        },

        distanceBetween: function(x1, y1, x2, y2)
        {
            return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        }
    });
})();
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
        scale: function(x = 0, y = 0, z = 0)
        {
            return Object.freeze([x, 0, 0, 0,
                                  0, y, 0, 0,
                                  0, 0, z, 0,
                                  0, 0, 0, 1]);
        },

        translate: function(x = 0, y = 0, z = 0)
        {
            return Object.freeze([1, 0, 0, 0,
                                  0, 1, 0, 0,
                                  0, 0, 1, 0,
                                  x, y, z, 1]);
        },

        rotate: function(x = 0, y = 0, z = 0)
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

            const temp = Rngon.matrix44.matrices_multiplied(my, mz);
            const mResult = Rngon.matrix44.matrices_multiplied(mx, temp);

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
        
        matrices_multiplied: function(m1 = [], m2 = [])
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
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Rasterizes into the internal pixel buffer all n-gons currently stored in the internal n-gon cache.
Rngon.ngon_filler = function(auxiliaryBuffers = [])
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.buffer : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const vertexSorters =
    {
        verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
        verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
    }

    // Used for interpolating values between n-gon edge spans during rasterization.
    const interpolationDeltas = {};
    const interpolatedValues = {};

    // Rasterize the n-gons.
    for (let n = 0; n < Rngon.internalState.transformedNgonsCache.numActiveNgons; n++)
    {
        const ngon = Rngon.internalState.transformedNgonsCache.ngons[n];

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }

        // Handle n-gons that constitute points and lines.
        /// TODO: Add depth and alpha testing for points and lines.
        if (ngon.vertices.length === 1)
        {
            const idx = ((Math.ceil(ngon.vertices[0].x) + Math.ceil(ngon.vertices[0].y) * renderWidth) * 4);
                
            pixelBuffer[idx + 0] = ngon.material.color.red;
            pixelBuffer[idx + 1] = ngon.material.color.green;
            pixelBuffer[idx + 2] = ngon.material.color.blue;
            pixelBuffer[idx + 3] = ngon.material.color.alpha;

            continue;
        }
        else if (ngon.vertices.length === 2)
        {
            Rngon.line_draw.into_pixel_buffer(ngon.vertices[0], ngon.vertices[1], ngon.material.color, Rngon.internalState.useDepthBuffer);

            continue;
        }

        // Handle n-gons with 3 or more vertices.
        {
            // Draw two virtual lines around the n-gon, one through its left-hand vertices
            // and the other through the right-hand ones, such that together the lines trace
            // the n-gon's outline.
            const leftEdge = [];
            const rightEdge = [];
            const leftVerts = [];
            const rightVerts = [];
            {
                // Figure out which of the n-gon's vertices are on its left edge and which on
                // the right one. The vertices will be arranged such that the first entry in
                // the list of left vertices will be the ngon's top-most (lowest y) vertex, and
                // the entries after that are successively higher in y. For the list of right
                // vertices, the first entry will be the ngon's bottom-most vertex, and entries
                // following are successively lower in y. Thus, by tracing first through the list
                // of left vertices and then through the list of right ones, you end up with an
                // anti-clockwise loop around the ngon.
                {
                    // Generic algorithm for n-sided convex polygons.
                    {
                        // Sort the vertices by height (i.e. by increasing y).
                        ngon.vertices.sort(vertexSorters.verticalAscending);
                        const topVert = ngon.vertices[0];
                        const bottomVert = ngon.vertices[ngon.vertices.length-1];

                        // The left side will always start with the top-most vertex, and the right side with
                        // the bottom-most vertex.
                        leftVerts.push(topVert);
                        rightVerts.push(bottomVert);

                        // Trace a line along x,y between the top-most vertex and the bottom-most vertex; and for
                        // the two intervening vertices, find whether they're to the left or right of that line on
                        // x. Being on the left side of that line means the vertex is on the ngon's left side,
                        // and same for the right side.
                        for (let i = 1; i < (ngon.vertices.length - 1); i++)
                        {
                            const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));
                            ((ngon.vertices[i].x >= lr)? rightVerts : leftVerts).push(ngon.vertices[i]);
                        }

                        // Make sure the right side is sorted bottom-to-top.
                        rightVerts.sort(vertexSorters.verticalDescending);

                        // Add linking vertices, so we can connect the two sides easily in a line loop.
                        leftVerts.push(bottomVert);
                        rightVerts.push(topVert);
                    }
                }

                // Now that we known which vertices are on the right-hand side and which on the left,
                // we can trace the two virtual lines around the polygon.
                for (let l = 1; l < leftVerts.length; l++) Rngon.line_draw.into_array(leftVerts[l-1], leftVerts[l], leftEdge, ngon.vertices[0].y);
                for (let r = 1; r < rightVerts.length; r++) Rngon.line_draw.into_array(rightVerts[r-1], rightVerts[r], rightEdge, ngon.vertices[0].y);
            }

            // Draw the ngon.
            {

                // Solid or textured fill.
                if (ngon.material.hasSolidFill)
                {
                    const polyYOffset = Math.ceil(ngon.vertices[0].y);
                    const polyHeight = leftEdge.length;

                    for (let y = 0; y < polyHeight; y++)
                    {
                        // Corresponding position in the pixel buffer.
                        const py = (y + polyYOffset);
                        if (py >= renderHeight) break;

                        const rowWidth = (rightEdge[y].x - leftEdge[y].x);
                        if (rowWidth <= 0) continue;

                        // We'll interpolate certain parameters across this pixel row. For that,
                        // let's pre-compute delta values we can just add onto the parameter's
                        // base value each step of the loop.
                        const interpolationStepSize = (1 / (rowWidth + 1));

                        interpolationDeltas.u =     (Rngon.lerp(leftEdge[y].u, rightEdge[y].u, interpolationStepSize) - leftEdge[y].u);
                        interpolationDeltas.v =     (Rngon.lerp(leftEdge[y].v, rightEdge[y].v, interpolationStepSize) - leftEdge[y].v);
                        interpolationDeltas.uvw =   (Rngon.lerp(leftEdge[y].uvw, rightEdge[y].uvw, interpolationStepSize) - leftEdge[y].uvw);
                        interpolationDeltas.depth = (Rngon.lerp(leftEdge[y].depth, rightEdge[y].depth, interpolationStepSize) - leftEdge[y].depth);

                        // Decrement the value by the delta so we can increment at the start
                        // of the loop rather than at the end of it - so we can e.g. bail out
                        // of the loop where needed without worry of not correctly incrementing
                        // the interpolated values.
                        interpolatedValues.u =     (leftEdge[y].u - interpolationDeltas.u);
                        interpolatedValues.v =     (leftEdge[y].v - interpolationDeltas.v);
                        interpolatedValues.uvw =   (leftEdge[y].uvw - interpolationDeltas.uvw);
                        interpolatedValues.depth = (leftEdge[y].depth - interpolationDeltas.depth);

                        for (let x = 0; x <= rowWidth; x++)
                        {
                            // Increment the interpolated values before doing anything else.
                            interpolatedValues.u += interpolationDeltas.u;
                            interpolatedValues.v += interpolationDeltas.v;
                            interpolatedValues.uvw += interpolationDeltas.uvw;
                            interpolatedValues.depth += interpolationDeltas.depth;

                            // Corresponding position in the pixel buffer.
                            const px = (leftEdge[y].x + x);
                            if (px >= renderWidth) break;

                            const pixelBufferIdx = ((px + py * renderWidth) * 4);

                            // Solid fill.
                            if (ngon.material.texture == null)
                            {
                                // Alpha testing. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (ngon.material.color.alpha !== 255) continue;

                                // Depth testing. Only allow the pixel to be drawn if any previous pixels
                                // at this screen position are further away from the camera.
                                if (depthBuffer)
                                {
                                    if (depthBuffer[pixelBufferIdx/4] <= interpolatedValues.depth) continue;
                                    else depthBuffer[pixelBufferIdx/4] = interpolatedValues.depth;
                                }

                                // Draw the pixel.
                                pixelBuffer[pixelBufferIdx + 0] = ngon.material.color.red;
                                pixelBuffer[pixelBufferIdx + 1] = ngon.material.color.green;
                                pixelBuffer[pixelBufferIdx + 2] = ngon.material.color.blue;
                                pixelBuffer[pixelBufferIdx + 3] = ngon.material.color.alpha;
                            }
                            // Textured fill.
                            else
                            {
                                let u = 0, v = 0;
                                
                                switch (ngon.material.textureMapping)
                                {
                                    case "affine":
                                    {
                                        const textureWidth = (ngon.material.texture.width - 0.001);
                                        const textureHeight = (ngon.material.texture.height - 0.001);

                                        u = (interpolatedValues.u / interpolatedValues.uvw);
                                        v = (interpolatedValues.v / interpolatedValues.uvw);
                                        
                                        u *= textureWidth;
                                        v *= textureHeight;

                                        /// FIXME: We need to flip v or the textures render upside down. Why?
                                        v = (textureHeight - v);

                                        // Wrap with repetition.
                                        /// FIXME: Why do we need to test for UV < 0 even when using positive
                                        /// but tiling UV coordinates? Doesn't render properly unless we do.
                                        if ((u < 0) ||
                                            (v < 0) ||
                                            (u > textureWidth) ||
                                            (v > textureHeight))
                                        {
                                            const uWasNeg = (u < 0);
                                            const vWasNeg = (v < 0);

                                            u = (Math.abs(u) % ngon.material.texture.width);
                                            v = (Math.abs(v) % ngon.material.texture.height);

                                            if (uWasNeg) u = (textureWidth - u);
                                            if (vWasNeg) v = (textureHeight - v);
                                        }
    
                                        break;
                                    }
                                    case "ortho":
                                    {
                                        u = x * ((ngon.material.texture.width - 0.001) / rowWidth);
                                        v = y * ((ngon.material.texture.height - 0.001) / ((polyHeight - 1) || 1));

                                        break;
                                    }
                                    default: Rngon.throw("Unknown texture-mapping mode."); break;
                                }

                                const texel = ngon.material.texture.pixels[(~~u) + (~~v) * ngon.material.texture.width];

                                // Verify that the texel isn't out of bounds.
                                if (!texel) continue;

                                // Alpha testing. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (texel.alpha !== 255) continue;

                                // Depth testing. Only allow the pixel to be drawn if any previous pixels
                                // at this screen position are further away from the camera.
                                if (depthBuffer)
                                {
                                    if (depthBuffer[pixelBufferIdx/4] <= interpolatedValues.depth) continue;
                                    else depthBuffer[pixelBufferIdx/4] = interpolatedValues.depth;
                                }

                                // Draw the pixel.
                                pixelBuffer[pixelBufferIdx + 0] = (texel.red   * ngon.material.color.unitRange.red);
                                pixelBuffer[pixelBufferIdx + 1] = (texel.green * ngon.material.color.unitRange.green);
                                pixelBuffer[pixelBufferIdx + 2] = (texel.blue  * ngon.material.color.unitRange.blue);
                                pixelBuffer[pixelBufferIdx + 3] = (texel.alpha * ngon.material.color.unitRange.alpha);
                            }

                            for (let b = 0; b < auxiliaryBuffers.length; b++)
                            {
                                if (ngon.material.auxiliary[auxiliaryBuffers[b].property] !== null)
                                {
                                    // Buffers are expected to consist of one element per pixel.
                                    auxiliaryBuffers[b].buffer[pixelBufferIdx/4] = ngon.material.auxiliary[auxiliaryBuffers[b].property];
                                }
                            }
                        }
                    }
                }

                // Draw a wireframe around any ngons that wish for one.
                if (Rngon.internalState.showGlobalWireframe ||
                    ngon.material.hasWireframe)
                {
                    const putline = (vert1, vert2)=>
                    {
                        Rngon.line_draw.into_pixel_buffer(vert1, vert2, ngon.material.wireframeColor, Rngon.internalState.useDepthBuffer)
                    };

                    // Draw a line around the polygon.
                    for (let l = 1; l < leftVerts.length; l++) putline(leftVerts[l-1], leftVerts[l]);
                    for (let r = 1; r < rightVerts.length; r++) putline(rightVerts[r-1], rightVerts[r]);
                }
            }
        }
    }
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Will create a HTML5 canvas element inside the given container, and render into it
// the given ngon meshes.
Rngon.render = function(canvasElementId,
                        meshes = [Rngon.mesh()],
                        options = {})
{
    // Initialize the object containing the data we'll return from this function.
    const callMetadata =
    {
        renderWidth: 0,
        renderHeight: 0,
        scene:
        {
            // The total count of n-gons rendered. May be smaller than the number of n-gons
            // originally submitted for rendering, due to visibility culling etc. performed
            // during the rendering process.
            numNgonsRendered: 0,
        },
        performance:
        {
            // How long we took to perform certain actions. All values are in milliseconds.
            timingMs:
            {
                // How long we took to initialize the renderer.
                initialization: performance.now(),

                // How long we took to transform all the supplied n-gons into screen space.
                transformation: 0,

                // How long we took to rasterize the supplied n-gons onto the target canvas.
                rasterization: 0,

                // How much time this function took, in total.
                total: performance.now(),
            }
        }
    }

    // Confirm that the default render options are valid.
    Rngon.assert && (typeof Rngon.render.defaultOptions.cameraPosition !== "undefined" &&
                     typeof Rngon.render.defaultOptions.cameraDirection !== "undefined" &&
                     typeof Rngon.render.defaultOptions.scale !== "undefined" &&
                     typeof Rngon.render.defaultOptions.depthSort !== "undefined" &&
                     typeof Rngon.render.defaultOptions.hibernateWhenNotOnScreen !== "undefined" &&
                     typeof Rngon.render.defaultOptions.fov !== "undefined")
                 || Rngon.throw("The default options object for render() is missing required properties.");

    // Combine the default render options with the user-supplied ones.
    options = Object.freeze(
    {
        ...Rngon.render.defaultOptions,
        ...options
    });

    // Modify any internal render parameters based on the user's options.
    {
        Rngon.internalState.useDepthBuffer = (options.depthSort === "depthbuffer");
        Rngon.internalState.usePerspectiveCorrectTexturing = (options.perspectiveCorrectTexturing === true);
        Rngon.internalState.showGlobalWireframe = (options.globalWireframe === true);
        Rngon.internalState.applyViewportClipping = (options.clipToViewport === true);
    }

    

    // Create or resize the n-gon cache to fit at least the number of n-gons that we've been
    // given to render.
    {
        const sceneNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

        if (!Rngon.internalState.transformedNgonsCache ||
            !Rngon.internalState.transformedNgonsCache.ngons.length ||
            (Rngon.internalState.transformedNgonsCache.ngons.length < sceneNgonCount))
        {
            const lengthDelta = (sceneNgonCount - Rngon.internalState.transformedNgonsCache.ngons.length);
            Rngon.internalState.transformedNgonsCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Rngon.ngon()));
        }

        Rngon.internalState.transformedNgonsCache.numActiveNgons = 0; 
    }

    const renderSurface = Rngon.screen(canvasElementId,
                                       Rngon.ngon_filler,
                                       Rngon.ngon_transformer,
                                       options.scale,
                                       options.fov,
                                       options.nearPlane,
                                       options.farPlane,
                                       options.auxiliaryBuffers);

    callMetadata.renderWidth = renderSurface.width;
    callMetadata.renderHeight = renderSurface.height;
    callMetadata.performance.timingMs.initialization = (performance.now() - callMetadata.performance.timingMs.initialization);

    // Render a single frame onto the render surface.
    if ((!options.hibernateWhenNotOnScreen || is_surface_in_view()))
    {
        renderSurface.wipe_clean();

        // Transform.
        callMetadata.performance.timingMs.transformation = performance.now();
        {
            const cameraMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.rotate(options.cameraDirection.x,
                                                                                          options.cameraDirection.y,
                                                                                          options.cameraDirection.z),
                                                                    Rngon.matrix44.translate(-options.cameraPosition.x,
                                                                                             -options.cameraPosition.y,
                                                                                             -options.cameraPosition.z));

            for (const mesh of meshes)
            {
                renderSurface.transform_ngons(mesh.ngons, mesh.objectSpaceMatrix(), cameraMatrix, options.cameraPosition);
            };

            callMetadata.scene.numNgonsRendered = Rngon.internalState.transformedNgonsCache.numActiveNgons;

            // Apply depth sorting to the transformed n-gons (which are now stored in the internal
            // n-gon cache).
            switch (options.depthSort)
            {
                case "none":
                case "depthbuffer": break;

                // Painter's algorithm, i.e. sort by depth.
                case "painter":
                {
                    const cache = Rngon.internalState.transformedNgonsCache;

                    /// TODO: Sub-array sorting in a GC-friendly way. For now, we need to resize the
                    /// array to exactly the right size, which means we likely then need to resize it
                    /// up again on the next render iteration.
                    cache.ngons.length = cache.numActiveNgons;

                    cache.ngons.sort((ngonA, ngonB)=>
                    {
                        const a = (ngonA.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonA.vertices.length);
                        const b = (ngonB.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonB.vertices.length);

                        return ((a === b)? 0 : ((a < b)? 1 : -1));
                    });

                    break;
                }
                
                default: Rngon.throw("Unknown depth sort option."); break;
            }
        }
        callMetadata.performance.timingMs.transformation = (performance.now() - callMetadata.performance.timingMs.transformation)

        // Rasterize.
        callMetadata.performance.timingMs.rasterization = performance.now();
        renderSurface.rasterize_ngon_cache();
        callMetadata.performance.timingMs.rasterization = (performance.now() - callMetadata.performance.timingMs.rasterization);

        callMetadata.performance.timingMs.total = (performance.now() - callMetadata.performance.timingMs.total);
        return callMetadata;
    }

    // Returns true if any horizontal part of the render surface DOM container is within the page's
    // visible region (accounting for the user having possibly scrolled the page up/down to cause
    // the container to have moved out of view).
    function is_surface_in_view()
    {
        const viewHeight = window.innerHeight;
        const containerRect = document.getElementById(canvasElementId).getBoundingClientRect();
        Rngon.assert && (containerRect != null) || Rngon.throw("Couldn't find the canvas container element.");

        return Boolean((containerRect.top > -containerRect.height) &&
                       (containerRect.top < viewHeight));
    }
};
Rngon.render.defaultOptions = 
{
    cameraPosition: Rngon.vector3(0, 0, 0),
    cameraDirection: Rngon.vector3(0, 0, 0),
    scale: 1,
    fov: 43,
    nearPlane: 1,
    farPlane: 1000,
    depthSort: "painter",
    clipToViewport: true,
    globalWireframe: false,
    hibernateWhenNotOnScreen: true,
    perspectiveCorrectTexturing: false,
    auxiliaryBuffers: [],
};
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Transforms the given n-gons into screen space for rendering. The transformed n-gons
// are stored in the internal n-gon cache.
Rngon.ngon_transformer = function(ngons = [], clipSpaceMatrix = [], screenSpaceMatrix = [], cameraPos)
{
    const transformedNgonsCache = Rngon.internalState.transformedNgonsCache;

    for (const ngon of ngons)
    {
        // Backface culling.
        if (!ngon.material.isTwoSided)
        {
            const viewVector =
            {
                x: (ngon.vertices[0].x - cameraPos.x),
                y: (ngon.vertices[0].y - cameraPos.y),
                z: (ngon.vertices[0].z - cameraPos.z),
            }

            if (ngon.normal.dot(viewVector) >= 0)
            {
                continue;
            }
        }

        // Copy the ngon into the internal n-gon cache, so we can operate on it later in the
        // render pipeline without destroying the original data.
        const cachedNgon = transformedNgonsCache.ngons[transformedNgonsCache.numActiveNgons++];
        {
            cachedNgon.vertices.length = 0;

            // Copy by value.
            for (let v = 0; v < ngon.vertices.length; v++)
            {
                cachedNgon.vertices[v] = Rngon.vertex(ngon.vertices[v].x,
                                                      ngon.vertices[v].y,
                                                      ngon.vertices[v].z,
                                                      ngon.vertices[v].u,
                                                      ngon.vertices[v].v,
                                                      ngon.vertices[v].w,);
            }

            // Copy by reference.
            cachedNgon.normal = ngon.normal;
            cachedNgon.material = ngon.material;
        }

        // Clipping.
        cachedNgon.transform(clipSpaceMatrix);
        {
            if (Rngon.internalState.applyViewportClipping)
            {
                cachedNgon.clip_to_viewport();

                // If there are no vertices left after clipping, it means this n-gon is not visible
                // on the screen at all. We can just ignore it.
                if (!cachedNgon.vertices.length)
                {
                    transformedNgonsCache.numActiveNgons--;
                    continue;
                }
            }
        }

        cachedNgon.transform(screenSpaceMatrix);
        cachedNgon.perspective_divide();
    };

    return;
}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// A 32-bit texture.
Rngon.texture_rgba = function(data = {width: 0, height: 0, pixels: []})
{
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
    if (typeof data.encoding !== "undefined" && data.encoding !== "none")
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
    const pixelArray = [];
    for (let i = 0; i < data.pixels.length; i += numColorChannels)
    {
        pixelArray.push({red:   data.pixels[i+0],
                         green: data.pixels[i+1],
                         blue:  data.pixels[i+2],
                         alpha: data.pixels[i+3]});
    }
        
    const publicInterface = Object.freeze(
    {
        width: data.width,
        height: data.height,
        pixels: pixelArray,
    });
    
    return publicInterface;
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
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 * A surface for rendering onto. Maps onto a HTML5 canvas.
 *
 */

"use strict";

Rngon.screen = function(canvasElementId = "",              // The DOM id of the canvas element.
                        ngon_fill_f = function(){},        // A function that rasterizes the given ngons onto the canvas.
                        ngon_transform_f = function(){},   // A function that transforms the given ngons into screen-space for the canvas.
                        scaleFactor = 1,
                        fov = 43,
                        nearPlane = 1,
                        farPlane = 1000,
                        auxiliaryBuffers = [])
{
    Rngon.assert && (typeof scaleFactor === "number") || Rngon.throw("Expected the scale factor to be a numeric value.");
    Rngon.assert && (typeof ngon_fill_f === "function" && typeof ngon_transform_f === "function")
                 || Rngon.throw("Expected ngon-manipulation functions to be provided.");

    const canvasElement = document.getElementById(canvasElementId);
    Rngon.assert && (canvasElement !== null) || Rngon.throw("Can't find the given canvas element.");

    // The pixel dimensions of the render surface.
    const screenWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * scaleFactor);
    const screenHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * scaleFactor);
    Rngon.assert && (!isNaN(screenWidth) && !isNaN(screenHeight)) || Rngon.throw("Failed to extract the canvas size.");
    canvasElement.setAttribute("width", screenWidth);
    canvasElement.setAttribute("height", screenHeight);

    const perspectiveMatrix = Rngon.matrix44.perspective((fov * Math.PI/180), (screenWidth / screenHeight), nearPlane, farPlane);
    const screenSpaceMatrix = Rngon.matrix44.ortho(screenWidth, screenHeight);

    const renderContext = canvasElement.getContext("2d");

    if ((Rngon.internalState.pixelBuffer.width != screenWidth) ||
        (Rngon.internalState.pixelBuffer.height != screenHeight))
    {
        Rngon.internalState.pixelBuffer = new ImageData(screenWidth, screenHeight);
    }

    if (Rngon.internalState.useDepthBuffer)
    {
        if ((Rngon.internalState.depthBuffer.width != screenWidth) ||
            (Rngon.internalState.depthBuffer.height != screenHeight) ||
            !Rngon.internalState.depthBuffer.buffer.length)
        {
            Rngon.internalState.depthBuffer.width = screenWidth;
            Rngon.internalState.depthBuffer.height = screenHeight;
            Rngon.internalState.depthBuffer.buffer = new Array(Rngon.internalState.depthBuffer.width * Rngon.internalState.depthBuffer.height)
                                                              .fill(Rngon.internalState.depthBuffer.clearValue); 
        }
        else
        {
            Rngon.internalState.depthBuffer.buffer.fill(Rngon.internalState.depthBuffer.clearValue);
        }
    }

    const publicInterface = Object.freeze(
    {
        width: screenWidth,
        height: screenHeight,

        wipe_clean: function()
        {
            Rngon.internalState.pixelBuffer.data.fill(0);
        },

        // Returns a copy of the ngons transformed into screen-space for this render surface.
        // Takes as input the ngons to be transformed, an object matrix which contains the object's
        // transforms, a camera matrix, which contains the camera's translation and rotation, and
        // a vector containing the camera's raw world position.
        transform_ngons: function(ngons = [], objectMatrix = [], cameraMatrix = [], cameraPos)
        {
            const viewSpaceMatrix = Rngon.matrix44.matrices_multiplied(cameraMatrix, objectMatrix);
            const clipSpaceMatrix = Rngon.matrix44.matrices_multiplied(perspectiveMatrix, viewSpaceMatrix);

            ngon_transform_f(ngons, clipSpaceMatrix, screenSpaceMatrix, cameraPos);
        },

        // Draw all n-gons currently stored in the internal n-gon cache onto the render surface.
        rasterize_ngon_cache: function()
        {
            ngon_fill_f(auxiliaryBuffers);
            renderContext.putImageData(Rngon.internalState.pixelBuffer, 0, 0);
        },
    });

    return publicInterface;
}
