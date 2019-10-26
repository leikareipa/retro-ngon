// WHAT: Concatenated JavaScript source files
// PROGRAM: Retro n-gon renderer
// VERSION: live (26 October 2019 02:14:17 UTC)
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
        },

        cross: function(other)
        {
            const c = Rngon.vector3();

            c.x = ((this.y * other.z) - (this.z * other.y));
            c.y = ((this.z * other.x) - (this.x * other.z));
            c.z = ((this.x * other.y) - (this.y * other.x));

            return c;
        },
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
    uvWrapping: "repeat",
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

            /// TODO: Depth-aware drawing is disabled until a better implementation of it is in place.
            respectDepth = false;

            let x0 = Math.round(vert1.x);
            let y0 = Math.round(vert1.y);
            const x1 = Math.round(vert2.x);
            const y1 = Math.round(vert2.y);
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
            const idx = ((Math.round(ngon.vertices[0].x) + Math.round(ngon.vertices[0].y) * renderWidth) * 4);
                
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
            // We'll sort the n-gon's vertices into those on its left side and those on its
            // right side.
            const leftVerts = [];
            const rightVerts = [];

            // Then we'll organize the sorted vertices into edges (lines between given two
            // vertices). Once we've got the edges figured out, we can render the n-gon by filling
            // in the spans between its edges.
            const leftEdges = [];
            const rightEdges = [];
            
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

                    leftVerts.push(topVert);
                    rightVerts.push(topVert);

                    // Trace a line along XY between the top-most vertex and the bottom-most vertex;
                    // and for the intervening vertices, find whether they're to the left or right of
                    // that line on X. Being on the left means the vertex is on the n-gon's left side,
                    // otherwise it's on the right side.
                    for (let i = 1; i < (ngon.vertices.length - 1); i++)
                    {
                        const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));
                        ((ngon.vertices[i].x >= lr)? rightVerts : leftVerts).push(ngon.vertices[i]);
                    }

                    leftVerts.push(bottomVert);
                    rightVerts.push(bottomVert);
                }
            }

            // Create edges out of the vertices.
            {
                const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectTexturing;

                const add_edge = (vert1, vert2, isLeftEdge, )=>
                {
                    const startY = Math.min((renderHeight - 1), Math.max(0, Math.round(vert1.y)));
                    const endY = Math.min((renderHeight - 1), Math.max(0, Math.round(vert2.y)));
                    
                    // Ignore horizontal edges.
                    if ((endY - startY) === 0) return;

                    const edgeHeight = (endY - startY);

                    const startX = Math.min((renderWidth - 1), Math.max(0, Math.round(vert1.x)));
                    const endX = Math.min((renderWidth - 1), Math.max(0, Math.ceil(vert2.x)));
                    const deltaX = ((endX - startX) / edgeHeight);

                    const startDepth = vert1.z;
                    const deltaDepth = ((vert2.z - vert1.z) / edgeHeight);

                    const u1 = (ngon.material.texture? vert1.u : 1);
                    const v1 = (ngon.material.texture? vert1.v : 1);
                    const u2 = (ngon.material.texture? vert2.u : 1);
                    const v2 = (ngon.material.texture? vert2.v : 1);

                    const startU = interpolatePerspective? (u1 / vert1.w)
                                                         : u1;
                    const deltaU = interpolatePerspective? (((u2 / vert2.w) - (u1 / vert1.w)) / edgeHeight)
                                                         : ((u2 - u1) / edgeHeight);

                    const startV = interpolatePerspective? (v1 / vert1.w)
                                                         : v1;
                    const deltaV = interpolatePerspective? (((v2 / vert2.w) - (v1 / vert1.w)) / edgeHeight)
                                                         : ((v2 - v1) / edgeHeight);

                    const startUVW = interpolatePerspective? (1 / vert1.w)
                                                           : 1;
                    const deltaUVW = interpolatePerspective? (((1 / vert2.w) - (1 / vert1.w)) / edgeHeight)
                                                           : 0;

                    const edge =
                    {
                        startY, endY,
                        startX, deltaX,
                        startDepth, deltaDepth,
                        startU, deltaU,
                        startV, deltaV,
                        startUVW, deltaUVW,
                    }

                    if (isLeftEdge) leftEdges.push(edge);
                    else rightEdges.push(edge);
                };

                for (let l = 1; l < leftVerts.length; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
                for (let r = 1; r < rightVerts.length; r++) add_edge(rightVerts[r-1], rightVerts[r], false);
            }

            // Draw the n-gon. On each horizontal raster line, there will be two edges: left and right.
            // We'll render into the pixel buffer each horizontal span that runs between the two edges.
            {
                let curLeftEdgeIdx = 0;
                let curRightEdgeIdx = 0;
                let leftEdge = leftEdges[curLeftEdgeIdx];
                let rightEdge = rightEdges[curRightEdgeIdx];
                
                if (!leftEdges.length || !rightEdges.length) continue;

                // Note: We assume the n-gon's vertices to be sorted by increasing Y.
                const ngonStartY = leftEdges[0].startY;
                const ngonEndY = leftEdges[leftEdges.length-1].endY;
                
                // Rasterize the n-gon in horizontal pixel spans over its height.
                for (let y = ngonStartY; y < ngonEndY; y++)
                {
                    const spanStartX = Math.min((renderWidth - 1), Math.max(0, Math.round(leftEdge.startX)));
                    const spanEndX = Math.min((renderWidth - 1), Math.max(0, Math.round(rightEdge.startX)));
                    const spanWidth = ((spanEndX - spanStartX) + 1);

                    if (spanWidth > 0)
                    {
                        // We'll interpolate these parameters across the span.
                        const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                        let iplDepth = (leftEdge.startDepth - deltaDepth);

                        const deltaU = ((rightEdge.startU - leftEdge.startU) / spanWidth);
                        let iplU = (leftEdge.startU - deltaU);

                        const deltaV = ((rightEdge.startV - leftEdge.startV) / spanWidth);
                        let iplV = (leftEdge.startV - deltaV);

                        const deltaUVW = ((rightEdge.startUVW - leftEdge.startUVW) / spanWidth);
                        let iplUVW = (leftEdge.startUVW - deltaUVW);

                        // Assumes the pixel buffer consists of 4 elements (RGBA) per pixel.
                        let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                        // Assumes the depth buffer consists of 1 element per pixel.
                        let depthBufferIdx = (pixelBufferIdx / 4);

                        // Draw the span into the pixel buffer.
                        for (let x = spanStartX; x < spanEndX; x++)
                        {
                            // Update values that're interpolated horizontally along the span.
                            iplDepth += deltaDepth;
                            iplU += deltaU;
                            iplV += deltaV;
                            iplUVW += deltaUVW;
                            pixelBufferIdx += 4;
                            depthBufferIdx++;

                            // Depth test.
                            if (depthBuffer[depthBufferIdx] <= iplDepth) continue;

                            // Solid fill.
                            if (!ngon.material.texture)
                            {
                                // Alpha test. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (ngon.material.color.alpha !== 255) continue;

                                pixelBuffer[pixelBufferIdx + 0] = ngon.material.color.red;
                                pixelBuffer[pixelBufferIdx + 1] = ngon.material.color.green;
                                pixelBuffer[pixelBufferIdx + 2] = ngon.material.color.blue;
                                pixelBuffer[pixelBufferIdx + 3] = ngon.material.color.alpha;
                                depthBuffer[depthBufferIdx] = iplDepth;
                            }
                            // Textured fill.
                            else
                            {
                                let u, v;

                                switch (ngon.material.textureMapping)
                                {
                                    // Affine mapping for power-of-two textures.
                                    case "affine":
                                    {
                                        u = (iplU / iplUVW);
                                        v = (iplV / iplUVW);

                                        switch (ngon.material.uvWrapping)
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

                                                u *= ngon.material.texture.width;
                                                v *= ngon.material.texture.height;

                                                break;
                                            }
                                            case "repeat":
                                            {
                                                u -= Math.floor(u);
                                                v -= Math.floor(v);

                                                u *= ngon.material.texture.width;
                                                v *= ngon.material.texture.height;

                                                // Modulo for power-of-two. This will also flip the texture for
                                                // negative UV coordinates.
                                                u = (u & (ngon.material.texture.width - 1));
                                                v = (v & (ngon.material.texture.height - 1));

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
                                        u = (iplU / iplUVW);
                                        v = (iplV / iplUVW);

                                        u *= ngon.material.texture.width;
                                        v *= ngon.material.texture.height;
                
                                        // Wrap with repetition.
                                        /// FIXME: Why do we need to test for UV < 0 even when using positive
                                        /// but tiling UV coordinates? Doesn't render properly unless we do.
                                        if ((u < 0) ||
                                            (v < 0) ||
                                            (u >= ngon.material.texture.width) ||
                                            (v >= ngon.material.texture.height))
                                        {
                                            const uWasNeg = (u < 0);
                                            const vWasNeg = (v < 0);
                
                                            u = (Math.abs(u) % ngon.material.texture.width);
                                            v = (Math.abs(v) % ngon.material.texture.height);
                
                                            if (uWasNeg) u = (ngon.material.texture.width - u);
                                            if (vWasNeg) v = (ngon.material.texture.height - v);
                                        }
                
                                        break;
                                    }
                                    // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
                                    case "ortho":
                                    {
                                        const ngonHeight = (ngonEndY - ngonStartY);

                                        // Pixel coordinates relative to the polygon.
                                        const ngonX = (x - spanStartX + 1);
                                        const ngonY = (y - ngonStartY);

                                        u = (ngonX * ((ngon.material.texture.width - 0.001) / spanWidth));
                                        v = (ngonY * ((ngon.material.texture.height - 0.001) / ngonHeight));

                                        // The texture image is flipped, so we need to flip V as well.
                                        v = (ngon.material.texture.height - v);

                                        break;
                                    }
                                    default: Rngon.throw("Unknown texture-mapping mode."); break;
                                }

                                const texel = ngon.material.texture.pixels[(~~u) + (~~v) * ngon.material.texture.width];

                                // Verify that the texel isn't out of bounds.
                                if (!texel) continue;

                                // Alpha test. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (texel.alpha !== 255) continue;

                                pixelBuffer[pixelBufferIdx + 0] = (texel.red   * ngon.material.color.unitRange.red);
                                pixelBuffer[pixelBufferIdx + 1] = (texel.green * ngon.material.color.unitRange.green);
                                pixelBuffer[pixelBufferIdx + 2] = (texel.blue  * ngon.material.color.unitRange.blue);
                                pixelBuffer[pixelBufferIdx + 3] = (texel.alpha * ngon.material.color.unitRange.alpha);
                                depthBuffer[depthBufferIdx] = iplDepth;
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

                    // Update values that're interpolated vertically along the edges.
                    {
                        leftEdge.startX += leftEdge.deltaX;
                        leftEdge.startDepth += leftEdge.deltaDepth;
                        leftEdge.startU += leftEdge.deltaU;
                        leftEdge.startV += leftEdge.deltaV;
                        leftEdge.startUVW += leftEdge.deltaUVW;

                        rightEdge.startX += rightEdge.deltaX;
                        rightEdge.startDepth += rightEdge.deltaDepth;
                        rightEdge.startU += rightEdge.deltaU;
                        rightEdge.startV += rightEdge.deltaV;
                        rightEdge.startUVW += rightEdge.deltaUVW;
                    }

                    // We can move onto the next edge when we're at the end of the current one.
                    if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
                    if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
                }

                // Draw a wireframe around any n-gons that wish for one.
                if (Rngon.internalState.showGlobalWireframe ||
                    ngon.material.hasWireframe)
                {
                    for (let l = 1; l < leftVerts.length; l++)
                    {
                        Rngon.line_draw.into_pixel_buffer(leftVerts[l-1], leftVerts[l], ngon.material.wireframeColor, Rngon.internalState.useDepthBuffer);
                    }

                    for (let r = 1; r < rightVerts.length; r++)
                    {
                        Rngon.line_draw.into_pixel_buffer(rightVerts[r-1], rightVerts[r], ngon.material.wireframeColor, Rngon.internalState.useDepthBuffer);
                    }
                }
            }
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

        // The total count of n-gons rendered. May be smaller than the number of n-gons
        // originally submitted for rendering, due to visibility culling etc. performed
        // during the rendering process.
        numNgonsRendered: 0,

        // The total time this call to render() took, in milliseconds.
        totalRenderTimeMs: performance.now(),
    }

    // Combine the default render options with the user-supplied ones.
    options = Object.freeze(
    {
        ...Rngon.render.defaultOptions,
        ...options
    });

    // Modify any internal render parameters based on the user's options.
    Rngon.internalState.useDepthBuffer = true;
    Rngon.internalState.showGlobalWireframe = (options.globalWireframe === true);
    Rngon.internalState.applyViewportClipping = (options.clipToViewport === true);
    Rngon.internalState.usePerspectiveCorrectTexturing = (options.perspectiveCorrectTexturing === true);

    // Render a single frame onto the render surface.
    if ((!options.hibernateWhenNotOnScreen || is_surface_in_view()))
    {
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

        prepare_ngon_cache(Rngon.internalState.transformedNgonsCache, meshes);
    
        transform_ngons(meshes, renderSurface, options.cameraPosition, options.cameraDirection);
        mark_npot_textures(Rngon.internalState.transformedNgonsCache);
        depth_sort_ngons(Rngon.internalState.transformedNgonsCache.ngons, options.depthSort);

        renderSurface.wipe_clean();
        renderSurface.rasterize_ngon_cache();

        callMetadata.numNgonsRendered = Rngon.internalState.transformedNgonsCache.numActiveNgons;
    }

    callMetadata.totalRenderTimeMs = (performance.now() - callMetadata.totalRenderTimeMs);

    return callMetadata;

    // Returns true if any horizontal part of the render surface DOM container is within the page's
    // visible region (accounting for the user having possibly scrolled the page up/down to cause
    // the container to have moved out of view).
    function is_surface_in_view()
    {
        const viewHeight = window.innerHeight;
        const containerRect = document.getElementById(canvasElementId).getBoundingClientRect();
        
        Rngon.assert && (containerRect != null)
                     || Rngon.throw("Couldn't find the canvas container element.");

        return Boolean((containerRect.top > -containerRect.height) &&
                       (containerRect.top < viewHeight));
    }

    // Creates or resizes the n-gon cache (where we place transformed n-gons for rendering) to fit
    // at least the number of n-gons contained in the array of meshes we've been asked to render.
    function prepare_ngon_cache(ngonCache = {}, meshes = [])
    {
        Rngon.assert && (typeof ngonCache === "object")
                     && (meshes instanceof Array)
                     || Rngon.throw("Invalid arguments to n-gon cache initialization.");

        const sceneNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

        if (!ngonCache ||
            !ngonCache.ngons.length ||
            (ngonCache.ngons.length < sceneNgonCount))
        {
            const lengthDelta = (sceneNgonCount - ngonCache.ngons.length);

            ngonCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Rngon.ngon()));
        }

        ngonCache.numActiveNgons = 0;

        return;
    }

    function transform_ngons(meshes = [], renderSurface, cameraPosition = Rngon.vector3(), cameraDirection = Rngon.vector3())
    {
        const cameraMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.rotate(cameraDirection.x,
                                                                                      cameraDirection.y,
                                                                                      cameraDirection.z),
                                                                Rngon.matrix44.translate(-cameraPosition.x,
                                                                                         -cameraPosition.y,
                                                                                         -cameraPosition.z));

        for (const mesh of meshes)
        {
            renderSurface.transform_ngons(mesh.ngons, mesh.objectSpaceMatrix(), cameraMatrix, cameraPosition);
        };

        return;
    }

    // Mark any non-power-of-two affine-mapped faces as using the non-power-of-two affine
    // mapper, as the default affine mapper expects textures to be power-of-two.
    function mark_npot_textures(ngonCache = {})
    {
        for (let i = 0; i < ngonCache.numActiveNgons; i++)
        {
            const ngon = ngonCache.ngons[i];

            if (ngon.material.texture &&
                ngon.material.textureMapping === "affine")
            {
                const widthIsPOT = ((ngon.material.texture.width & (ngon.material.texture.width - 1)) === 0);
                const heightIsPOT = ((ngon.material.texture.height & (ngon.material.texture.height - 1)) === 0);

                if (ngon.material.texture.width === 0) widthIsPOT = false;
                if (ngon.material.texture.height === 0) heightIsPOT = false;

                if (!widthIsPOT ||
                    !heightIsPOT)
                {
                    ngon.material.textureMapping = "affine-npot";
                }
            }
        }

        return;
    }

    // Apply depth sorting to the transformed n-gons (which are now stored in the internal
    // n-gon cache).
    function depth_sort_ngons(ngons = [], depthSortingMode = "")
    {
        switch (depthSortingMode)
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
            // list. Together with the depth buffer, this allows early rejection of obscured polygons.
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
    depthSort: "", // Use default.
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
    let viewVector = {x:0.0, y:0.0, z:0.0};
    const transformedNgonsCache = Rngon.internalState.transformedNgonsCache;

    for (const ngon of ngons)
    {
        // Backface culling.
        if (!ngon.material.isTwoSided)
        {
            viewVector.x = (ngon.vertices[0].x - cameraPos.x);
            viewVector.y = (ngon.vertices[0].y - cameraPos.y);
            viewVector.z = (ngon.vertices[0].z - cameraPos.z);

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

            // Copy by value.
            cachedNgon.material = {...ngon.material};

            // Copy by reference.
            cachedNgon.normal = ngon.normal;

            cachedNgon.isActive = true;
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

    // Mark as inactive any cached n-gons that we didn't touch, so the renderer knows
    // to ignore them for the current frame.
    for (let i = transformedNgonsCache.numActiveNgons; i < transformedNgonsCache.ngons.length; i++)
    {
        transformedNgonsCache.ngons[i].isActive = false;
    }

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
    // Note: We also flip the texture on the Y axis, to counter the fact that textures
    // become flipped on Y during rendering (i.e. we pre-emptively un-flip it, here).
    const pixelArray = [];
    for (let y = 0; y < data.height; y++)
    {
        for (let x = 0; x < data.width; x++)
        {
            const idx = ((x + (data.height - y - 1) * data.width) * numColorChannels);

            pixelArray.push({red:   data.pixels[idx + 0],
                             green: data.pixels[idx + 1],
                             blue:  data.pixels[idx + 2],
                             alpha: data.pixels[idx + 3]});
        }
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

    if (Rngon.internalState.useDepthBuffer &&
        (Rngon.internalState.depthBuffer.width != screenWidth) ||
        (Rngon.internalState.depthBuffer.height != screenHeight) ||
        !Rngon.internalState.depthBuffer.buffer.length)
    {
        Rngon.internalState.depthBuffer.width = screenWidth;
        Rngon.internalState.depthBuffer.height = screenHeight;
        Rngon.internalState.depthBuffer.buffer = new Array(Rngon.internalState.depthBuffer.width * Rngon.internalState.depthBuffer.height); 
    }

    const publicInterface = Object.freeze(
    {
        width: screenWidth,
        height: screenHeight,

        wipe_clean: function()
        {
            Rngon.internalState.pixelBuffer.data.fill(0);

            if (Rngon.internalState.useDepthBuffer)
            {
                Rngon.internalState.depthBuffer.buffer.fill(Rngon.internalState.depthBuffer.clearValue);
            }
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
