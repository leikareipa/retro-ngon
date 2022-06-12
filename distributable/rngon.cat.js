// WHAT: Concatenated JavaScript source files
// PROGRAM: Retro n-gon renderer
// VERSION: beta live (12 June 2022 14:53:26 UTC)
// AUTHOR: Tarpeeksi Hyvae Soft and others
// LINK: https://www.github.com/leikareipa/retro-ngon/
// FILES:
//	./js/paletted-canvas/paletted-canvas.js
//	./js/retro-ngon/retro-ngon.js
//	./js/retro-ngon/core/util.js
//	./js/retro-ngon/core/internal-state.js
//	./js/retro-ngon/core/trig.js
//	./js/retro-ngon/core/light.js
//	./js/retro-ngon/core/color.js
//	./js/retro-ngon/core/vector3.js
//	./js/retro-ngon/core/vertex.js
//	./js/retro-ngon/core/material.js
//	./js/retro-ngon/core/mesh.js
//	./js/retro-ngon/core/ngon.js
//	./js/retro-ngon/core/matrix44.js
//	./js/retro-ngon/base-modules/rasterize.js
//	./js/retro-ngon/base-modules/transform-clip-light.js
//	./js/retro-ngon/base-modules/surface-wipe.js
//	./js/retro-ngon/api/render.js
//	./js/retro-ngon/api/render-async.js
//	./js/retro-ngon/core/render-shared.js
//	./js/retro-ngon/core/texture.js
//	./js/retro-ngon/core/surface.js
/////////////////////////////////////////////////

/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: Paletted canvas (https://github.com/leikareipa/paletted-canvas)
 * 
 * This is an early in-development version of a paletted <canvas>. Future versions will add
 * more documentation, fix bugs, etc.
 * 
 */

// Provides an ImageData-like interface for storing paletted image data.
class IndexedImageData {
    #palette
    #width
    #height
    #data

    constructor(data, width, height, palette) {
        // Validate input.
        {
            if (!(data instanceof Uint8ClampedArray)) {
                throw new Error("The data must be a Uint8ClampedArray array.");
            }

            if (
                (typeof width !== "number") ||
                (typeof height !== "number")
            ){
                throw new Error("The width and height must be numbers.");
            }
        }

        this.#width = width;
        this.#height = height;
        this.#data = data;
        this.palette = (palette || [[0, 0, 0, 0]]);
    }

    // To get the palette index at x as a quadruplet of 8-bit RGBA values, do "palette[x]".
    // To modify individual indices of the returned palette, do "palette[x] = [R, G, B, A]".
    // To replace the entire palette, do "palette = [[R, G, B, A], [R, G, B, A], ...]".
    // When setting palette data, the alpha (A) component is optional - if not defined, a
    // default of 255 will be used.
    get palette() {
        return this.#palette;
    }

    // Replaces the current palette with a new palette. The new palette should be an array
    // containing 8-bit (0-255) RGBA quadruplet arrays; e.g. [[255, 0, 0, 255], [0, 255, 0, 255]]
    // for a palette of red and green (the alpha component is optional and will default to
    // 255 if not given).
    set palette(newPalette) {
        if (!Array.isArray(newPalette)) {
            throw new Error("The palette must be an array.");
        }

        newPalette.forEach(color=>{
            color.length = 4;
            if (typeof color[3] === "undefined") {
                color[3] = 255;
            }
        });

        newPalette = newPalette.map(color=>Uint8ClampedArray.from(color));

        const palette = {
            byte: newPalette,
            dword: new Uint32Array(newPalette.map(color=>((color[3] << 24) | (color[2] << 16) | (color[1] << 8) | color[0]))),
        };

        // We use a proxy to allow "this.#palette[x] = ..." to modify individual indices even
        // though the underlying this.#palette object doesn't have index keys.
        this.#palette = new Proxy(palette, {
            set: (palette, index, newValue)=>{
                palette.byte[index] = newValue;
                this.palette = palette.byte;
                return true;
            },
            get: (palette, index)=>{
                return (palette[index] || palette.byte[index]);
            },
        });
    }

    get data() {
        return this.#data;
    }

    get width() {
        return this.#width;
    }

    get height() {
        return this.#height;
    }

    get colorSpace() {
        return "indexed";
    }
};

class PalettedCanvas extends HTMLCanvasElement {
    #canvasImage
    #canvasContext

    constructor() {
        super();
    }
    
    static get observedAttributes() {
        return ["width", "height"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((oldValue != newValue) && ["width", "height"].includes(name)) {
            this.#canvasContext = super.getContext("2d");
            this.#canvasImage = this.#canvasContext.createImageData(super.width, super.height);
        }
    }

    getContext(contextType = "2d") {
        if (contextType !== "2d") {
            throw new Error(`Only the "2d" context type is supported.`);
        }

        // Emulates the interface of CanvasRenderingContext2D.
        return {
            createImageData: this.#createImageData.bind(this),
            putImageData: this.#putImageData.bind(this),
        };
    }

    #createImageData() {
        return new IndexedImageData(
            new Uint8ClampedArray(super.width * super.height),
            super.width,
            super.height,
        );
    }

    #putImageData(image) {
        if (!(image instanceof IndexedImageData)) {
            throw new Error("Only images of type IndexedImageData can be rendered.");
        }

        if (
            !(this.#canvasImage instanceof ImageData) ||
            !(this.#canvasContext instanceof CanvasRenderingContext2D)
        ){
            throw new Error("Internal error: incomplete state initialization.");
        }

        // Convert the paletted image into a 32-bit image on the canvas.
        {
            const palette = image.palette.dword;
            const pixelBuffer32bit = new Uint32Array(this.#canvasImage.data.buffer);

            for (let i = 0; i < image.data.length; i++) {
                pixelBuffer32bit[i] = palette[image.data[i]];
            }
        }

        this.#canvasContext.putImageData(this.#canvasImage, 0, 0);
    }
};

customElements.define("paletted-canvas", PalettedCanvas, {extends: "canvas"});
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
/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 * Various small utility functions and the like.
 *
 */

"use strict";

// Call this function using optional chaining: "Rsed.assert?.()".
// To disable assertions, comment out this function definition.
Rngon.assert = (condition, errorMessage)=>
{
    if (!condition)
    {
        Rngon.throw(errorMessage);
    }
}

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
/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

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
    depthBuffer: {
        width: 1,
        height: 1,
        data: new Array(1),
        clearValue: Infinity,
    },

    // A string identifying the kind of depth sorting to be done prior to rasterization.
    depthSortingMode: undefined,

    auxiliaryBuffers: [],

    // Whether to render into an indexed-color (paletted) pixel buffer.
    usePalette: false,
    palette: undefined,

    // Pixel buffer for rasterization. This will be scaled to match the requested
    // render resolution; and the renderer's rasterization pass will populate it
    // with the rendered frame's pixel values.
    pixelBuffer: new ImageData(1, 1),

    // For each pixel in the rendered frame, metadata about the state of the renderer
    // at that pixel, intended to be used by shaders. The array's size will be set to
    // match the requested render resolution.
    fragmentBuffer: {
        width: 1,
        height: 1,
        data: new Array(1),
        clearValue: {
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
    pixel_shader: undefined,

    useVertexShader: false,
    vertex_shader: undefined,

    useContextShader: false,
    context_shader: undefined,

    // The render resolution when using off-screen rendering. Has no effect on the
    // resolution of on-screen, into-canvas rendering.
    offscreenRenderWidth: 1,
    offscreenRenderHeight: 1,

    // A scalar for the internal render resolution. Values below 1 mean the image
    // will be rendered at a resolution lower than the display size, then upscaled.
    renderScale: 1,

    usePerspectiveCorrectInterpolation: false,

    // If set to true, all n-gons will be rendered with a wireframe.
    showGlobalWireframe: false,

    // If true, all n-gons will be clipped against the viewport.
    applyViewportClipping: true,

    // Distance, in world units, to the near and far clipping planes.
    nearPlaneDistance: 1,
    farPlaneDistance: 1,

    // Field of view.
    fov: 45,

    cameraDirection: undefined,
    cameraPosition: undefined,

    // Whether the renderer is allowed to call window.alert(), e.g. to alert the user
    // to errors. This parameter can be set directly, as the render API doesn't yet
    // expose a way to toggle it otherwise.
    allowWindowAlert: false,

    // Pre-allocated memory; stores the n-gons that were most recently passed to render()
    // and then transformed into screen space. In other words, these are the n-gons that
    // were rendered into the most recent frame.
    ngonCache: {
        count: 0,
        ngons: [],
    },

    // Pre-allocated memory; stores the vertices of the n-gon cache's n-gons.
    vertexCache: {
        count: 0,
        vertices:[],
    },

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
    Rngon.assert?.(
        (typeof position === "object"),
        "Expected numbers as parameters to the light factory."
    );

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
    Rngon.assert?.(
        (((red   >= 0) && (red   <= 255)) &&
         ((green >= 0) && (green <= 255)) &&
         ((blue  >= 0) && (blue  <= 255)) &&
         ((alpha >= 0) && (alpha <= 255))),
        "The given color values are out of range."
    );

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
    Rngon.assert?.(
        ((typeof x === "number") &&
         (typeof y === "number") &&
         (typeof z === "number")),
        "Expected numbers as parameters to the vector3 factory."
    );

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
    Rngon.assert?.(
        (m.length === 16),
        "Expected a 4 x 4 matrix to transform the vector by."
    );

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

Rngon.vector3.mul_scalar = function(v, scalar)
{
    return Rngon.vector3((v.x * scalar), (v.y * scalar), (v.z * scalar));
}

Rngon.vector3.add_scalar = function(v, scalar)
{
    return Rngon.vector3((v.x + scalar), (v.y + scalar), (v.z + scalar));
}

Rngon.vector3.sub_scalar = function(v, scalar)
{
    return Rngon.vector3((v.x - scalar), (v.y - scalar), (v.z - scalar));
}

Rngon.vector3.mul = function(v, other)
{
    return Rngon.vector3((v.x * other.x), (v.y * other.y), (v.z * other.z));
}

Rngon.vector3.add = function(v, other)
{
    return Rngon.vector3((v.x + other.x), (v.y + other.y), (v.z + other.z));
}

Rngon.vector3.sub = function(v, other)
{
    return Rngon.vector3((v.x - other.x), (v.y - other.y), (v.z - other.z));
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
                        worldX = x, worldY = y, worldZ = z,
                        normalX = 0, normalY = 1, normalZ = 0)
{
    Rngon.assert?.(
        ((typeof x === "number") &&
         (typeof y === "number") &&
         (typeof z === "number") &&
         (typeof w === "number") &&
         (typeof u === "number") &&
         (typeof v === "number") &&
         (typeof worldX === "number") &&
         (typeof worldY === "number") &&
         (typeof worldZ === "number")),
        "Expected numbers as parameters to the vertex factory."
    );

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

        normalX,
        normalY,
        normalZ,
    };

    return returnObject;
}

// Transforms the vertex by the given 4x4 matrix.
Rngon.vertex.transform = function(v, m = [])
{
    Rngon.assert?.(
        (m.length === 16),
        "Expected a 4 x 4 matrix to transform the vertex by."
    );
    
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
 * 2021 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// Material for n-gons.
Rngon.material = function(properties = {})
{
    const publicInterface = {
        ...Rngon.material.default,
        ...properties,
    };

    return publicInterface;
}

Rngon.material.default = {
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
    allowAlphaReject: false,
    allowAlphaBlend: false,
    auxiliary: {},
};
/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A collection of ngons, with shared translation and rotation.
Rngon.mesh = function(ngons = [Rngon.ngon()], transform = {})
{
    Rngon.assert?.(
        (ngons instanceof Array),
        "Expected a list of ngons for creating an ngon mesh."
    );

    Rngon.assert?.(
        (transform instanceof Object),
        "Expected an object with transformation properties."
    );

    Rngon.assert?.(
        (typeof Rngon.mesh.defaultTransform.rotation !== "undefined" &&
         typeof Rngon.mesh.defaultTransform.translation !== "undefined" &&
         typeof Rngon.mesh.defaultTransform.scaling !== "undefined"),
        "The default transforms object for mesh() is missing required properties."
    );

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

Rngon.mesh.object_space_matrix = function(mesh)
{
    const translationMatrix = Rngon.matrix44.translation(
        mesh.translation.x,
        mesh.translation.y,
        mesh.translation.z
    );

    const rotationMatrix = Rngon.matrix44.rotation(
        mesh.rotation.x,
        mesh.rotation.y,
        mesh.rotation.z
    );

    const scalingMatrix = Rngon.matrix44.scaling(
        mesh.scale.x,
        mesh.scale.y,
        mesh.scale.z
    );

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
Rngon.ngon = function(vertices = [Rngon.vertex()],
                      material = Rngon.material(), // or {}
                      vertexNormals = Rngon.vector3(0, 1, 0))
{
    Rngon.assert?.(
        (vertices instanceof Array),
        "Expected an array of vertices to make an ngon."
    );

    Rngon.assert?.(
        (material instanceof Object),
        "Expected an object containing user-supplied options."
    );

    // Combine default material options with the user-supplied ones.
    material = Rngon.material(material);

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

Rngon.ngon.perspective_divide = function(ngon)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.perspective_divide(vert);
    }
}

Rngon.ngon.transform = function(ngon, matrix44)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.transform(vert, matrix44);
    }
}

// Clips all vertices against the sides of the viewport. Adapted from Benny
// Bobaganoosh's 3d software renderer, the source for which is available at
// https://github.com/BennyQBD/3DSoftwareRenderer.
const axes = ["x", "y", "z"];
const factors = [1, -1];
Rngon.ngon.clip_to_viewport = function(ngon)
{
    for (const axis of axes)
    {
        for (const factor of factors)
        {
            if (!ngon.vertices.length)
            {
                break;
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
                    break;
                }

                ngon.vertices.length = 0;

                break;
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

                    ngon.vertices[numOriginalVertices + k++] = Rngon.vertex(
                        Rngon.lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                        Rngon.lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                        Rngon.lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                        Rngon.lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                        Rngon.lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                        Rngon.lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                        Rngon.lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep),
                        Rngon.lerp(prevVertex.worldX, ngon.vertices[i].worldX, lerpStep),
                        Rngon.lerp(prevVertex.worldY, ngon.vertices[i].worldY, lerpStep),
                        Rngon.lerp(prevVertex.worldZ, ngon.vertices[i].worldZ, lerpStep),
                        Rngon.lerp(prevVertex.normalX, ngon.vertices[i].normalX, lerpStep),
                        Rngon.lerp(prevVertex.normalY, ngon.vertices[i].normalY, lerpStep),
                        Rngon.lerp(prevVertex.normalZ, ngon.vertices[i].normalZ, lerpStep)
                    );
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
        }
    }

    return;
}
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

            Rngon.assert?.(
                (mResult.length === 16),
                "Expected a 4 x 4 matrix."
            );

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
            Rngon.assert?.(
                ((m1.length === 16) && (m2.length === 16)),
                "Expected 4 x 4 matrices."
            );

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

            Rngon.assert?.(
                (mResult.length === 16),
                "Expected a 4 x 4 matrix."
            );
            
            return Object.freeze(mResult);
        },
    });
})();
/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

Rngon.baseModules = (Rngon.baseModules || {});

{ // A block to limit the scope of the file-global variables we set up, below.

const maxNumVertsPerPolygon = 500;

// For rendering polygons, we'll sort the polygon's vertices into those on its left
// side and those on its right side.
const leftVerts = new Array(maxNumVertsPerPolygon);
const rightVerts = new Array(maxNumVertsPerPolygon);

// Edges connect a polygon's vertices and provide interpolation parameters for
// rasterization. For each horizontal span inside the polygon, we'll render pixels
// from the left edge to the right edge.
const leftEdges = new Array(maxNumVertsPerPolygon).fill().map(e=>({}));
const rightEdges = new Array(maxNumVertsPerPolygon).fill().map(e=>({}));

const vertexSorters = {
    verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
    verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
}

// Rasterizes into the internal pixel buffer all n-gons currently stored in the
// internal n-gon cache.
//
// Note: Consider this the inner render loop; it may contain ugly things like
// code repetition for the benefit of performance. If you'd like to refactor the
// code, please benchmark its effects on performance first - maintaining or
// improving performance would be great, losing performance would be bad.
//
Rngon.baseModules.rasterize = function(auxiliaryBuffers = [])
{
    for (let n = 0; n < Rngon.internalState.ngonCache.count; n++)
    {
        const ngon = Rngon.internalState.ngonCache.ngons[n];

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }
        else if (ngon.vertices.length == 1)
        {
            Rngon.baseModules.rasterize.point(ngon.vertices[0], ngon.material, n);
            continue;
        }
        else if (ngon.vertices.length == 2)
        {
            Rngon.baseModules.rasterize.line(ngon.vertices[0], ngon.vertices[1], ngon.material.color, n, false);
            continue;
        }
        else
        {
            Rngon.baseModules.rasterize.polygon(ngon, n, auxiliaryBuffers);
            continue;
        }
    }

    return;
}

// Rasterizes a polygon with 3+ vertices into the render's pixel buffer.
Rngon.baseModules.rasterize.polygon = function(
    ngon = Rngon.ngon(),
    ngonIdx = 0,
    auxiliaryBuffers = []
)
{
    Rngon.assert?.(
        (ngon.vertices.length >= 3),
        "Polygons must have 3 or more vertices"
    );

    Rngon.assert?.(
        (ngon.vertices.length < maxNumVertsPerPolygon),
        "Overflowing the vertex buffer"
    );

    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    const usePixelShader = Rngon.internalState.usePixelShader;
    const useAuxiliaryBuffers = auxiliaryBuffers.length;
    const fragmentBuffer = Rngon.internalState.fragmentBuffer.data;
    const pixelBufferClamped8 = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;
    const usePalette = Rngon.internalState.usePalette;
    const pixelBuffer32 = usePalette
        ? undefined
        : new Uint32Array(pixelBufferClamped8.buffer);

    let numLeftVerts = 0;
    let numRightVerts = 0;
    let numLeftEdges = 0;
    let numRightEdges = 0;

    const material = ngon.material;
    let texture = (material.texture || null);
    let textureMipLevel = null;
    let textureMipLevelIdx = 0;
    
    if (material.texture)
    {
        const numMipLevels = texture.mipLevels.length;
        textureMipLevelIdx = Math.max(0, Math.min((numMipLevels - 1), Math.round((numMipLevels - 1) * ngon.mipLevel)));
        textureMipLevel = texture.mipLevels[textureMipLevelIdx];
    }

    sort_vertices();

    define_edges();

    if (material.hasFill)
    {
        if (usePalette)
        {
            paletted_fill();
        }
        else if (
            texture &&
            depthBuffer &&
            !usePixelShader &&
            !material.allowAlphaReject &&
            !material.allowAlphaBlend &&
            (material.textureMapping === "affine") &&
            (material.color.red === 255) &&
            (material.color.green === 255) &&
            (material.color.blue === 255)
        ){
            plain_textured_fill();
        }
        else if (
            !texture &&
            depthBuffer &&
            !usePixelShader &&
            !useAuxiliaryBuffers &&
            !material.allowAlphaReject &&
            !material.allowAlphaBlend
        ){
            plain_solid_fill();
        }
        else
        {
            generic_fill();
        }
    }

    // Draw a wireframe around any n-gons that wish for one.
    if (Rngon.internalState.showGlobalWireframe ||
        material.hasWireframe)
    {
        for (let l = 1; l < numLeftVerts; l++)
        {
            Rngon.baseModules.rasterize.line(leftVerts[l-1], leftVerts[l], material.wireframeColor, ngonIdx, true);
        }

        for (let r = 1; r < numRightVerts; r++)
        {
            Rngon.baseModules.rasterize.line(rightVerts[r-1], rightVerts[r], material.wireframeColor, ngonIdx, true);
        }
    }

    return;

    // Defines the edges connecting the polygon's vertices on the left and right sides of
    // the polygon. Each edge is associated with interpolation parameters for rasterization.
    function define_edges()
    {
        for (let l = 1; l < numLeftVerts; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
        for (let r = 1; r < numRightVerts; r++) add_edge(rightVerts[r-1], rightVerts[r], false);

        function add_edge(vert1, vert2, isLeftEdge)
        {
            const startY = Math.min(renderHeight, Math.max(0, Math.floor(vert1.y)));
            const endY = Math.min(renderHeight, Math.max(0, Math.floor(vert2.y)));
            const edgeHeight = (endY - startY);
            
            // Ignore horizontal edges.
            if (edgeHeight === 0) return;

            const w1 = interpolatePerspective? vert1.w : 1;
            const w2 = interpolatePerspective? vert2.w : 1;

            const startX = Math.min(renderWidth, Math.max(0, Math.floor(vert1.x)));
            const endX = Math.min(renderWidth, Math.max(0, Math.floor(vert2.x)));
            const deltaX = ((endX - startX) / edgeHeight);

            const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
            const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
            const startDepth = depth1/w1;
            const deltaDepth = ((depth2/w2 - depth1/w1) / edgeHeight);

            const startShade = vert1.shade;
            const deltaShade = ((vert2.shade - vert1.shade) / edgeHeight);

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

    // Generic vertex-sorting algorithm for n-sided convex polygons. Sorts the vertices
    // into two arrays, left and right. The left array contains all vertices that are on
    // the left-hand side of a line across the polygon from the highest to the lowest
    // vertex, and the right array has the rest.
    function sort_vertices()
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

    // Fills the current polygon, with certain performance-increasing assumptions made about it.
    // The polygon and render state must fulfill the following criteria:
    // - Depth buffering enabled
    // - No pixel shader
    // - No alpha operations
    // - Textured
    // - White material color
    // - Only affine texture-mapping
    function plain_textured_fill()
    {
        let curLeftEdgeIdx = 0;
        let curRightEdgeIdx = 0;
        let leftEdge = leftEdges[curLeftEdgeIdx];
        let rightEdge = rightEdges[curRightEdgeIdx];
        
        if (!numLeftEdges || !numRightEdges) return;

        // Note: We assume the n-gon's vertices to be sorted by increasing Y.
        const ngonStartY = leftEdges[0].startY;
        const ngonEndY = leftEdges[numLeftEdges-1].endY;

        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
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

                let pixelBufferIdx = ((spanStartX + y * renderWidth) - 1);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update values that're interpolated horizontally along the span.
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplU += deltaU;
                    iplV += deltaV;
                    iplInvW += deltaInvW;
                    pixelBufferIdx++;

                    const depth = (iplDepth / iplInvW);
                    if (depthBuffer[pixelBufferIdx] <= depth) continue;

                    // Texture UV coordinates.
                    let u = (iplU / iplInvW);
                    let v = (iplV / iplInvW);

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

                    const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];
                    
                    // Make sure we gracefully exit if accessing the texture out of bounds.
                    if (!texel)
                    {
                        continue;
                    }

                    const shade = (material.renderVertexShade? iplShade : 1);
                    const red   = (texel.red   * shade);
                    const green = (texel.green * shade);
                    const blue  = (texel.blue  * shade);

                    depthBuffer[pixelBufferIdx] = depth;

                    // If shade is > 1, the color values may exceed 255, in which case we write into
                    // the clamped 8-bit view to get 'free' clamping.
                    if (shade > 1)
                    {
                        const idx = (pixelBufferIdx * 4);
                        pixelBufferClamped8[idx+0] = red;
                        pixelBufferClamped8[idx+1] = green;
                        pixelBufferClamped8[idx+2] = blue;
                        pixelBufferClamped8[idx+3] = 255;
                    }
                    else
                    {
                        pixelBuffer32[pixelBufferIdx] = (
                            (255 << 24) +
                            (blue << 16) +
                            (green << 8) +
                            red
                        );
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
            }

            // We can move onto the next edge when we're at the end of the current one.
            if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
            if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
        }

        return;
    }

    // Fills the current non-textured polygon, with certain performance-enhancing
    // assumptions. The polygon and render state must fulfill the following criteria:
    // - No texture
    // - No pixel shader
    // - No alpha operations
    // - No auxiliary buffers
    // - Depth buffering enabled
    function plain_solid_fill()
    {
        let curLeftEdgeIdx = 0;
        let curRightEdgeIdx = 0;
        let leftEdge = leftEdges[curLeftEdgeIdx];
        let rightEdge = rightEdges[curRightEdgeIdx];
        
        if (!numLeftEdges || !numRightEdges) return;

        // Note: We assume the n-gon's vertices to be sorted by increasing Y.
        const ngonStartY = leftEdges[0].startY;
        const ngonEndY = leftEdges[numLeftEdges-1].endY;
        
        // Rasterize the n-gon in horizontal pixel spans over its height.
        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
            const spanWidth = ((spanEndX - spanStartX) + 1);

            if (spanWidth > 0)
            {
                const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                let iplDepth = (leftEdge.startDepth - deltaDepth);

                const deltaShade = ((rightEdge.startShade - leftEdge.startShade) / spanWidth);
                let iplShade = (leftEdge.startShade - deltaShade);

                const deltaInvW = ((rightEdge.startInvW - leftEdge.startInvW) / spanWidth);
                let iplInvW = (leftEdge.startInvW - deltaInvW);

                let pixelBufferIdx = ((spanStartX + y * renderWidth) - 1);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update values that're interpolated horizontally along the span.
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplInvW += deltaInvW;
                    pixelBufferIdx++;

                    const depth = (iplDepth / iplInvW);
                    if (depthBuffer[pixelBufferIdx] <= depth) continue;

                    // The color we'll write into the pixel buffer for this pixel; assuming
                    // it passes the alpha test, the depth test, etc.
                    const shade = (material.renderVertexShade? iplShade : 1);
                    const red   = (material.color.red   * shade);
                    const green = (material.color.green * shade);
                    const blue  = (material.color.blue  * shade);

                    depthBuffer[pixelBufferIdx] = depth;

                    // If shade is > 1, the color values may exceed 255, in which case we write into
                    // the clamped 8-bit view to get 'free' clamping.
                    if (shade > 1)
                    {
                        const idx = (pixelBufferIdx * 4);
                        pixelBufferClamped8[idx+0] = red;
                        pixelBufferClamped8[idx+1] = green;
                        pixelBufferClamped8[idx+2] = blue;
                        pixelBufferClamped8[idx+3] = 255;
                    }
                    else
                    {
                        pixelBuffer32[pixelBufferIdx] = (
                            (255 << 24) +
                            (blue << 16) +
                            (green << 8) +
                            red
                        );
                    }
                }
            }

            // Update values that're interpolated vertically along the edges.
            {
                leftEdge.startX      += leftEdge.deltaX;
                leftEdge.startDepth  += leftEdge.deltaDepth;
                leftEdge.startShade  += leftEdge.deltaShade;
                leftEdge.startInvW   += leftEdge.deltaInvW;

                rightEdge.startX     += rightEdge.deltaX;
                rightEdge.startDepth += rightEdge.deltaDepth;
                rightEdge.startShade += rightEdge.deltaShade;
                rightEdge.startInvW  += rightEdge.deltaInvW;
            }

            // We can move onto the next edge when we're at the end of the current one.
            if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
            if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
        }

        return;
    }

    // Fills the current polygon into an indexed-color (paletted) pixel buffer.
    // NOTE: THIS IS AN EARLY WORK-IN-PROGRES IMPLEMENTATION, NOT READY FOR USE.
    function paletted_fill()
    {
        let curLeftEdgeIdx = 0;
        let curRightEdgeIdx = 0;
        let leftEdge = leftEdges[curLeftEdgeIdx];
        let rightEdge = rightEdges[curRightEdgeIdx];
        
        if (!numLeftEdges || !numRightEdges) return;

        // Note: We assume the n-gon's vertices to be sorted by increasing Y.
        const ngonStartY = leftEdges[0].startY;
        const ngonEndY = leftEdges[numLeftEdges-1].endY;
        
        // Rasterize the n-gon in horizontal pixel spans over its height.
        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
            const spanWidth = ((spanEndX - spanStartX) + 1);

            if (spanWidth > 0)
            {
                const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                let iplDepth = (leftEdge.startDepth - deltaDepth);

                const deltaInvW = ((rightEdge.startInvW - leftEdge.startInvW) / spanWidth);
                let iplInvW = (leftEdge.startInvW - deltaInvW);

                let pixelBufferIdx = ((spanStartX + y * renderWidth) - 1);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update values that're interpolated horizontally along the span.
                    iplDepth += deltaDepth;
                    iplInvW += deltaInvW;
                    pixelBufferIdx++;

                    const depth = (iplDepth / iplInvW);
                    if (depthBuffer[pixelBufferIdx] <= depth) continue;

                    depthBuffer[pixelBufferIdx] = depth;
                    pixelBufferClamped8[pixelBufferIdx] = material.colorIdx;
                }
            }

            // Update values that're interpolated vertically along the edges.
            {
                leftEdge.startX      += leftEdge.deltaX;
                leftEdge.startDepth  += leftEdge.deltaDepth;
                leftEdge.startInvW   += leftEdge.deltaInvW;

                rightEdge.startX     += rightEdge.deltaX;
                rightEdge.startDepth += rightEdge.deltaDepth;
                rightEdge.startInvW  += rightEdge.deltaInvW;
            }

            // We can move onto the next edge when we're at the end of the current one.
            if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
            if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
        }

        return;
    }

    // Fills the current polygon. No performance-enhancing assumptions are made, so this
    // is the most compatible filler, but also potentially the slowest. 
    function generic_fill()
    {
        let curLeftEdgeIdx = 0;
        let curRightEdgeIdx = 0;
        let leftEdge = leftEdges[curLeftEdgeIdx];
        let rightEdge = rightEdges[curRightEdgeIdx];
        
        if (!numLeftEdges || !numRightEdges) return;

        // Note: We assume the n-gon's vertices to be sorted by increasing Y.
        const ngonStartY = leftEdges[0].startY;
        const ngonEndY = leftEdges[numLeftEdges-1].endY;
        
        // Rasterize the n-gon in horizontal pixel spans over its height.
        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
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

                // Assumes the depth buffer consists of 1 element per pixel.
                let pixelBufferIdx = ((spanStartX + y * renderWidth) - 1);

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
                    pixelBufferIdx++;

                    if (usePixelShader)
                    {
                        iplWorldX += deltaWorldX;
                        iplWorldY += deltaWorldY;
                        iplWorldZ += deltaWorldZ;
                    }

                    const depth = (iplDepth / iplInvW);

                    // Depth test.
                    if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth)) continue;

                    let shade = (material.renderVertexShade? iplShade  : 1);

                    // The color we'll write into the pixel buffer for this pixel; assuming
                    // it passes the alpha test, the depth test, etc.
                    let red = 0;
                    let green = 0;
                    let blue = 0;

                    // Solid fill.
                    if (!texture)
                    {
                        // Note: We assume that the triangle transformer has already culled away
                        // n-gons whose base color alpha is less than 255; so we don't test for
                        // material.allowAlphaReject.

                        if (material.allowAlphaBlend &&
                            Rngon.baseModules.rasterize.stipple(material.color.alpha, x, y))
                        {
                            continue;
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
                        if (!texel)
                        {
                            continue;
                        }

                        if (material.allowAlphaReject &&
                            (texel.alpha !== 255))
                        {
                            continue;
                        }

                        if (material.allowAlphaBlend &&
                            Rngon.baseModules.rasterize.stipple(material.color.alpha, x, y))
                        {
                            continue;
                        }

                        red   = (texel.red   * material.color.unitRange.red   * shade);
                        green = (texel.green * material.color.unitRange.green * shade);
                        blue  = (texel.blue  * material.color.unitRange.blue  * shade);
                    }

                    // The pixel passed its alpha test, depth test, etc., and should be drawn
                    // on screen.
                    {
                        // If shade is > 1, the color values may exceed 255, in which case we write into
                        // the clamped 8-bit view to get 'free' clamping.
                        if (shade > 1)
                        {
                            const idx = (pixelBufferIdx * 4);
                            pixelBufferClamped8[idx+0] = red;
                            pixelBufferClamped8[idx+1] = green;
                            pixelBufferClamped8[idx+2] = blue;
                            pixelBufferClamped8[idx+3] = 255;
                        }
                        else
                        {
                            pixelBuffer32[pixelBufferIdx] = (
                                (255 << 24) +
                                (blue << 16) +
                                (green << 8) +
                                red
                            );
                        }

                        if (depthBuffer)
                        {
                            depthBuffer[pixelBufferIdx] = depth;
                        }

                        if (usePixelShader)
                        {
                            const fragment = fragmentBuffer[pixelBufferIdx];
                            fragment.ngonIdx = ngonIdx;
                            fragment.textureUScaled = ~~u;
                            fragment.textureVScaled = ~~v;
                            fragment.depth = (iplDepth / iplInvW);
                            fragment.shade = iplShade;
                            fragment.worldX = (iplWorldX / iplInvW);
                            fragment.worldY = (iplWorldY / iplInvW);
                            fragment.worldZ = (iplWorldZ / iplInvW);
                            fragment.w = (1 / iplInvW);
                        }

                        for (let b = 0; b < auxiliaryBuffers.length; b++)
                        {
                            if (material.auxiliary[auxiliaryBuffers[b].property] !== null)
                            {
                                // Buffers are expected to consist of one element per pixel.
                                auxiliaryBuffers[b].buffer[pixelBufferIdx] = material.auxiliary[auxiliaryBuffers[b].property];
                            }
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

        return;
    }
}

// Rasterizes a line between the two given vertices into the render's pixel buffer.
Rngon.baseModules.rasterize.line = function(
    vert1 = Rngon.vertex(),
    vert2 = Rngon.vertex(),
    color = Rngon.color_rgba(),
    ngonIdx = 0,
    ignoreDepthBuffer = false
)
{
    if (color.alpha !== 255)
    {
        return;
    }
    
    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    const farPlane = Rngon.internalState.farPlaneDistance;
    const usePixelShader = Rngon.internalState.usePixelShader;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const pixelBufferClamped8 = Rngon.internalState.pixelBuffer.data;
    const pixelBuffer = new Uint32Array(pixelBufferClamped8.buffer);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;
 
    const startX = Math.floor(vert1.x);
    const startY = Math.floor(vert1.y);
    const endX = Math.floor(vert2.x);
    const endY = Math.ceil(vert2.y);
    let lineLength = Math.round(Math.sqrt((endX - startX) * (endX - startX) + (endY - startY) * (endY - startY)));
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);
    let curX = startX;
    let curY = startY;

    // Establish interpolation parameters.
    const w1 = (interpolatePerspective? vert1.w : 1);
    const w2 = (interpolatePerspective? vert2.w : 1);
    const depth1 = (vert1.z / farPlane);
    const depth2 = (vert2.z / farPlane);
    let startDepth = depth1/w1;
    const deltaDepth = ((depth2/w2 - depth1/w1) / lineLength);
    let startShade = vert1.shade/w1;
    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / lineLength);
    let startInvW = 1/w1;
    const deltaInvW = ((1/w2 - 1/w1) / lineLength);
    if (usePixelShader)
    {
        var startWorldX = vert1.worldX/w1;
        var deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / lineLength);

        var startWorldY = vert1.worldY/w1;
        var deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / lineLength);

        var startWorldZ = vert1.worldZ/w1;
        var deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / lineLength);
    }

    while (lineLength--)
    {
        const x = Math.floor(curX);
        const y = Math.floor(curY);

        put_pixel(x, y);

        // Increment interpolated values.
        {
            curX += deltaX;
            curY += deltaY;
            startDepth += deltaDepth;
            startShade += deltaShade;
            startInvW += deltaInvW;

            if (usePixelShader)
            {
                startWorldX += deltaWorldX;
                startWorldY += deltaWorldY;
                startWorldZ += deltaWorldZ;
            }
        }
    }

    function put_pixel(x, y)
    {
        if ((x < 0) ||
            (y < 0) ||
            (x >= renderWidth) ||
            (y >= renderHeight))
        {
            return;
        }

        const pixelBufferIdx = (x + y * renderWidth);
        const depth = (startDepth / startInvW);
        const shade = (startShade / startInvW);
        const red = (color.red * shade);
        const green = (color.green * shade);
        const blue = (color.blue * shade);

        // Draw the pixel.
        if (ignoreDepthBuffer ||
            !depthBuffer ||
            (depthBuffer[pixelBufferIdx] > depth))
        {
            // If shade is > 1, the color values may exceed 255, in which case we write into
            // the clamped 8-bit view to get 'free' clamping.
            if (shade > 1)
            {
                const idx = (pixelBufferIdx * 4);
                pixelBufferClamped8[idx+0] = red;
                pixelBufferClamped8[idx+1] = green;
                pixelBufferClamped8[idx+2] = blue;
                pixelBufferClamped8[idx+3] = 255;
            }
            else
            {
                pixelBuffer[pixelBufferIdx] = (
                    (255 << 24) +
                    (blue << 16) +
                    (green << 8) +
                    red
                );
            }

            if (depthBuffer && !ignoreDepthBuffer)
            {
                depthBuffer[pixelBufferIdx] = depth;
            }

            if (usePixelShader)
            {
                const fragment = Rngon.internalState.fragmentBuffer.data[pixelBufferIdx];
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
};

Rngon.baseModules.rasterize.point = function(
    vertex = Rngon.vertex(),
    material = {},
    ngonIdx = 0
)
{
    if (material.color.alpha != 255)
    {
        return;
    }

    const usePixelShader = Rngon.internalState.usePixelShader;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const pixelBufferClamped8 = Rngon.internalState.pixelBuffer.data;
    const pixelBuffer = new Uint32Array(pixelBufferClamped8.buffer);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const x = Math.floor(vertex.x);
    const y = Math.floor(vertex.y);
    const pixelBufferIdx = (x + y * renderWidth);

    if ((x < 0) ||
        (y < 0) ||
        (x >= renderWidth) ||
        (y >= renderHeight))
    {
        return;
    }

    const depth = (vertex.z / Rngon.internalState.farPlaneDistance);
    const shade = (material.renderVertexShade? vertex.shade : 1);
    const color = (material.texture? material.texture.pixels[0] : material.color);
    const red = (color.red * shade);
    const green = (color.green * shade);
    const blue = (color.blue * shade);

    if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth))
    {
        return;
    }
    
    // Write the pixel.
    {
        // If shade is > 1, the color values may exceed 255, in which case we write into
        // the clamped 8-bit view to get 'free' clamping.
        if (shade > 1)
        {
            const idx = (pixelBufferIdx * 4);
            pixelBufferClamped8[idx+0] = red;
            pixelBufferClamped8[idx+1] = green;
            pixelBufferClamped8[idx+2] = blue;
            pixelBufferClamped8[idx+3] = 255;
        }
        else
        {
            pixelBuffer[pixelBufferIdx] = (
                (255 << 24) +
                (blue << 16) +
                (green << 8) +
                red
            );
        }

        if (depthBuffer)
        {
            depthBuffer[pixelBufferIdx] = depth;
        }

        if (usePixelShader)
        {
            const fragment = Rngon.internalState.fragmentBuffer.data[pixelBufferIdx];
            fragment.ngonIdx = ngonIdx;
            fragment.textureUScaled = 0;
            fragment.textureVScaled = 0;
            fragment.depth = depth;
            fragment.shade = shade;
            fragment.worldX = vertex.worldX;
            fragment.worldY = vertex.worldY;
            fragment.worldZ = vertex.worldZ;
            fragment.w = vertex.w;
        }
    }

    return;
}

// For emulating pixel transparency with stipple patterns.
Rngon.baseModules.rasterize.stipple = (function()
{
    const patterns = [
        // ~99% transparent.
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

        // ~70% transparent.
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

    // Append a reverse set of patterns to go from 50% to 0% transparent.
    for (let i = (patterns.length - 2); i >= 0; i--)
    {
        patterns.push({
            width: patterns[i].width,
            height: patterns[i].height,
            pixels: patterns[i].pixels.map(p=>Number(!p)),
        });
    }

    // Returns a function that returns true if the given screen pixel coordinate
    // should be transparent at the given alpha level (0-255); false otherwise.
    return function(alpha, screenX, screenY)
    {
        // Full transparency.
        if (alpha <= 0)
        {
            return true;
        }
        // Full opaqueness.
        else if (alpha >= 255)
        {
            return false;
        }
        // Partial transparency.
        else
        {
            const patternIdx = Math.floor(alpha / (256 / patterns.length));
            const pattern = patterns[patternIdx];
            const pixelIdx = ((screenX % pattern.width) + (screenY % pattern.height) * pattern.width);

            if (pattern.pixels[pixelIdx])
            {
                return true;
            }
        }

        return false;
    };
})();

}
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

Rngon.baseModules = (Rngon.baseModules || {});

// Applies lighting to the given n-gons, and transforms them into screen space
// for rendering. The processed n-gons are stored in the internal n-gon cache.
Rngon.baseModules.transform_clip_light = function(
    ngons = [],
    objectMatrix = [],
    cameraMatrix = [],
    projectionMatrix = [],
    screenSpaceMatrix = [],
    cameraPos
)
{
    const viewVector = {x:0.0, y:0.0, z:0.0};
    const ngonCache = Rngon.internalState.ngonCache;
    const vertexCache = Rngon.internalState.vertexCache;
    const clipSpaceMatrix = Rngon.matrix44.multiply(projectionMatrix, cameraMatrix);

    for (const ngon of ngons)
    {
        // Ignore fully transparent polygons.
        if (!ngon.material.hasWireframe &&
            ngon.material.allowAlphaReject &&
            (ngon.material.color.alpha <= 0))
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
                const srcVertex = ngon.vertices[v];
                const dstVertex = cachedNgon.vertices[v] = vertexCache.vertices[vertexCache.count++];

                dstVertex.x = srcVertex.x;
                dstVertex.y = srcVertex.y;
                dstVertex.z = srcVertex.z;
                dstVertex.u = srcVertex.u;
                dstVertex.v = srcVertex.v;
                dstVertex.w = srcVertex.w;
                dstVertex.shade = srcVertex.shade;

                if (Rngon.internalState.useVertexShader ||
                    (ngon.material.vertexShading === "gouraud"))
                {
                    cachedNgon.vertexNormals[v] = Rngon.vector3(
                        ngon.vertexNormals[v].x,
                        ngon.vertexNormals[v].y,
                        ngon.vertexNormals[v].z
                    );
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
        // in steps: first into world space, then into clip space, and finally into screen
        // space.
        if (cachedNgon.material.allowTransform)
        {
            // world space. Any built-in lighting is applied, if requested by the n-gon's
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

                        cachedNgon.vertices[v].normalX = cachedNgon.vertexNormals[v].x;
                        cachedNgon.vertices[v].normalY = cachedNgon.vertexNormals[v].y;
                        cachedNgon.vertices[v].normalZ = cachedNgon.vertexNormals[v].z;
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
                    Rngon.baseModules.transform_clip_light.apply_lighting(cachedNgon);
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

Rngon.baseModules.transform_clip_light.apply_lighting = function(ngon)
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
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

Rngon.baseModules = (Rngon.baseModules || {});

// Resets the render surface's buffers to their initial contents.
Rngon.baseModules.surface_wipe = function()
{
    Rngon.internalState.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (Rngon.internalState.useDepthBuffer)
    {
        Rngon.internalState.depthBuffer.data.fill(Rngon.internalState.depthBuffer.clearValue);
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
Rngon.render = function(
    canvasElement,
    meshes = [Rngon.mesh()],
    options = {}
)
{
    const renderCallInfo = Rngon.renderShared.setup_render_call_info();

    options = Object.freeze({
        ...Rngon.renderShared.defaultRenderOptions,
        ...options
    });

    Rngon.renderShared.initialize_internal_render_state(options);

    // The canvas element can be passed in in a couple of ways, e.g. as a string that
    // identifies the DOM element, or directly as a DOM element object. So let's figure
    // out what we received, and turn it into a DOM element object for the renderer
    // to operate on.
    if (typeof canvasElement == "string")
    {
        canvasElement = document.getElementById(canvasElement);
    }
    else if (!(canvasElement instanceof Element))
    {
        Rngon.throw("Invalid canvas element.");
    }
    
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
        rasterize: null,
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

        state.renderScale = options.scale;
        state.offscreenRenderWidth = options.width;
        state.offscreenRenderHeight = options.height;

        state.depthSortingMode = options.depthSort;

        state.auxiliaryBuffers = options.auxiliaryBuffers;

        state.nearPlaneDistance = options.nearPlane;
        state.farPlaneDistance = options.farPlane;

        state.fov = options.fov;
        state.cameraDirection = options.cameraDirection;
        state.cameraPosition = options.cameraPosition;

        state.usePerspectiveCorrectInterpolation = Boolean(
            options.perspectiveCorrectTexturing || // <- Name in pre-beta.2.
            options.perspectiveCorrectInterpolation
        );

        state.useVertexShader = Boolean(options.vertexShader);
        state.vertex_shader = options.vertexShader;

        state.useContextShader = Boolean(options.contextShader);
        state.context_shader = options.contextShader;

        state.usePixelShader = Boolean(options.pixelShader);
        state.pixel_shader = (
            options.shaderFunction || // <- Name in pre-beta.3.
            options.pixelShader
        ); 

        state.usePalette = Array.isArray(options.palette);
        state.palette = options.palette;

        state.modules.rasterize = (
            options.modules.rasterize ||
            Rngon.baseModules.rasterize
        );

        state.modules.transform_clip_light = (
            options.modules.transformClipLight ||
            Rngon.baseModules.transform_clip_light
        );

        state.modules.surface_wipe = (
            options.modules.surfaceWipe ||
            Rngon.baseModules.surface_wipe
        );

        return;
    },

    // Creates or resizes the n-gon cache to fit at least the number of n-gons contained
    // in the given array of meshes.
    prepare_ngon_cache: function(meshes = [Rngon.ngon()])
    {
        Rngon.assert?.(
            (meshes instanceof Array),
            "Invalid arguments to n-gon cache initialization."
        );

        const ngonCache = Rngon.internalState.ngonCache;
        const totalNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

        if (!ngonCache ||
            !ngonCache.ngons.length ||
            (ngonCache.ngons.length < totalNgonCount))
        {
            const lengthDelta = (totalNgonCount - ngonCache.ngons.length);

            ngonCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Rngon.ngon()));
        }

        ngonCache.count = 0;

        return;
    },

    // Creates or resizes the vertex cache to fit at least the number of vertices contained
    // in the given array of meshes.
    prepare_vertex_cache: function(meshes = [Rngon.ngon()])
    {
        Rngon.assert?.(
            (meshes instanceof Array),
            "Invalid arguments to n-gon cache initialization."
        );

        const vertexCache = Rngon.internalState.vertexCache;
        let totalVertexCount = 0;

        for (const mesh of meshes)
        {
            for (const ngon of mesh.ngons)
            {
                totalVertexCount += ngon.vertices.length;
            }
        }

        if (!vertexCache ||
            !vertexCache.vertices.length ||
            (vertexCache.vertices.length < totalVertexCount))
        {
            const lengthDelta = (totalVertexCount - vertexCache.vertices.length);

            vertexCache.vertices.push(...new Array(lengthDelta).fill().map(e=>Rngon.vertex()));
        }

        vertexCache.count = 0;

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
        palette: null,
        modules: {
            rasterize: null, // Null defaults to Rngon.baseModules.rasterize.
            transformClipLight: null, // Null defaults to Rngon.baseModules.transform_clip_light.
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

    Rngon.assert?.(
        (Number.isInteger(data.width) && Number.isInteger(data.height)),
        "Expected texture width and height to be integer values."
    );
    
    Rngon.assert?.(
        ((data.width >= 0) && (data.height >= 0)),
        "Expected texture width and height to be no less than zero."
    );

    Rngon.assert?.(
        ((data.width <= maxWidth) && (data.height <= maxHeight)),
        `Expected texture width/height to be no more than ${maxWidth}/${maxHeight}.`
    );

    // If necessary, decode the pixel data into raw RGBA/8888.
    if (data.encoding !== "none")
    {
        // In Base64-encoded data, each pixel's RGBA is expected to be given as a 16-bit
        // value, where each of the RGB channels takes up 5 bits and the alpha channel
        // 1 bit.
        if (data.encoding === "base64")
        {
            Rngon.assert?.(
                (data.channels === "rgba:5+5+5+1"),
                "Expected Base64-encoded data to be in RGBA 5551 format."
            );

            data.pixels = (()=>
            {
                const rgba = [];
                const decoded = atob(data.pixels);

                // We should have an array where each pixel is a 2-byte value.
                Rngon.assert?.(
                    (decoded.length === (data.width * data.height * 2)),
                    "Unexpected data length for a Base64-encoded texture."
                );

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

    Rngon.assert?.(
        (data.pixels.length === (data.width * data.height * numColorChannels)),
        "The texture's pixel array size doesn't match its width and height."
    );

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
            Rngon.assert?.(
                (mipmaps.length > 0),
                "Failed to generate mip levels for a texture."
            );

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
// element unless the 'canvasElement' parameter is null, in which case rendering will be
// to an off-screen buffer only.
//
// Returns null if the surface could not be created.
Rngon.surface = function(canvasElement)
{
    const state = Rngon.internalState;
    const renderOffscreen = (canvasElement === null);

    let surfaceWidth = undefined,
        surfaceHeight = undefined,
        renderContext = undefined;

    try
    {
        ({
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            renderContext
        } = (renderOffscreen? setup_offscreen : setup_onscreen)());

        initialize_internal_surface_state();
    }
    catch (error)
    {
        Rngon.log(`Failed to create a render surface. ${error}`);
        return null;
    }

    const cameraMatrix = Rngon.matrix44.multiply(
        Rngon.matrix44.rotation(
            state.cameraDirection.x,
            state.cameraDirection.y,
            state.cameraDirection.z
        ),
        Rngon.matrix44.translation(
            -state.cameraPosition.x,
            -state.cameraPosition.y,
            -state.cameraPosition.z
        )
    );

    const perspectiveMatrix = Rngon.matrix44.perspective(
        (state.fov * (Math.PI / 180)),
        (surfaceWidth / surfaceHeight),
        state.nearPlaneDistance,
        state.farPlaneDistance
    );

    const screenSpaceMatrix = Rngon.matrix44.ortho(
        (surfaceWidth + 1),
        (surfaceHeight + 1)
    );

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
            state.modules.surface_wipe();

            // Prepare the meshes' n-gons for rendering. This will place the transformed
            // n-gons into the internal n-gon cache, Rngon.internalState.ngonCache.
            {
                Rngon.renderShared.prepare_vertex_cache(meshes);
                Rngon.renderShared.prepare_ngon_cache(meshes);

                for (const mesh of meshes)
                {
                    state.modules.transform_clip_light(
                        mesh.ngons,
                        Rngon.mesh.object_space_matrix(mesh),
                        cameraMatrix,
                        perspectiveMatrix,
                        screenSpaceMatrix,
                        state.cameraPosition
                    );
                };

                Rngon.renderShared.mark_npot_textures_in_ngon_cache();
                Rngon.renderShared.depth_sort_ngon_cache(state.depthSortingMode);
            }

            // Render the n-gons from the n-gon cache. The rendering will go into the
            // renderer's internal pixel buffer, Rngon.internalState.pixelBuffer.
            {
                state.modules.rasterize(state.auxiliaryBuffers);

                if (state.usePixelShader)
                {
                    const args = {
                        renderWidth: surfaceWidth,
                        renderHeight: surfaceHeight,
                        fragmentBuffer: state.fragmentBuffer.data,
                        pixelBuffer: state.pixelBuffer.data,
                        ngonCache: state.ngonCache.ngons,
                        cameraPosition: state.cameraPosition,
                    };

                    const paramNamesString = `{${Object.keys(args).join(",")}}`;

                    switch (typeof state.pixel_shader)
                    {
                        case "function": {
                            state.pixel_shader(args);
                            break;
                        }
                        // Shader functions as strings are supported to allow shaders to be
                        // used in Web Workers. These strings are expected to be of - or
                        // equivalent to - the form "(a)=>{console.log(a)}".
                        case "string": {
                            Function(paramNamesString, `(${state.pixel_shader})(${paramNamesString})`)(args);
                            break;
                        }
                        default: {
                            Rngon.throw("Unrecognized type of pixel shader function.");
                            break;
                        }
                    }
                }

                if (!renderOffscreen)
                {
                    if (state.useContextShader)
                    {
                        state.context_shader({
                            context: renderContext,
                            image: state.pixelBuffer,
                        });
                    }
                    else
                    {
                        state.pixelBuffer.palette = state.palette;
                        renderContext.putImageData(state.pixelBuffer, 0, 0);
                    }
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

            return (
                (containerRect.top > -containerRect.height) &&
                (containerRect.top < viewHeight)
            );
        },
    });

    return publicInterface;

    // Initializes the internal render buffers if they're not already in a suitable state.
    function initialize_internal_surface_state()
    {
        if (
            (state.pixelBuffer.width != surfaceWidth) ||
            (state.pixelBuffer.height != surfaceHeight)
        ){
            state.pixelBuffer = renderContext.createImageData(surfaceWidth, surfaceHeight);
        }

        if (
            state.usePixelShader &&
            (state.fragmentBuffer.width != surfaceWidth) ||
            (state.fragmentBuffer.height != surfaceHeight)
        ){
            state.fragmentBuffer.width = surfaceWidth;
            state.fragmentBuffer.height = surfaceHeight;
            state.fragmentBuffer.data = new Array(surfaceWidth * surfaceHeight).fill().map(e=>({}));
        }

        if (
            state.useDepthBuffer &&
            (state.depthBuffer.width != surfaceWidth) ||
            (state.depthBuffer.height != surfaceHeight) ||
            !state.depthBuffer.data.length
        ){
            state.depthBuffer.width = surfaceWidth;
            state.depthBuffer.height = surfaceHeight;
            state.depthBuffer.data = new Array(state.depthBuffer.width * state.depthBuffer.height); 
        }

        return;
    }

    // Initializes the target DOM <canvas> element for rendering into. Throws on errors.
    function setup_onscreen()
    {
        Rngon.assert?.(
            (canvasElement instanceof Element),
            "Can't find the given canvas element."
        );

        const renderContext = canvasElement.getContext("2d");

        Rngon.assert?.(
            (renderContext !== null),
            "Couldn't establish a canvas render context."
        );

        // Size the canvas as per the requested render scale.
        const surfaceWidth = Rngon.renderable_width_of(canvasElement, state.renderScale);
        const surfaceHeight = Rngon.renderable_height_of(canvasElement, state.renderScale);
        Rngon.assert?.(
            ((surfaceWidth > 0) && (surfaceHeight > 0)),
            "Couldn't retrieve the canvas's dimensions."
        );
        canvasElement.setAttribute("width", surfaceWidth);
        canvasElement.setAttribute("height", surfaceHeight);

        return {
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            renderContext
        };
    }

    // Sets up rendering into an off-screen buffer, i.e. without using a DOM <canvas>
    // element. Right now, since the renderer by default renders into an off-screen
    // buffer first and then transfers the pixels onto a <canvas>, this function
    // is more about just skipping initialization of the <canvas> element.
    //
    // Note: This function should throw on errors.
    function setup_offscreen()
    {
        return {
            surfaceWidth: state.offscreenRenderWidth,
            surfaceHeight: state.offscreenRenderHeight,
            renderContext: {
                createImageData: function(width, height)
                {
                    return new ImageData(width, height);
                },
            },
        };
    }
}
