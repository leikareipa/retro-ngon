/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: Paletted canvas (https://github.com/leikareipa/paletted-canvas)
 * 
 * This is an early in-development version of a paletted <canvas>. Future versions will add
 * more documentation, fix bugs, etc.
 * 
 */

const isRunningInWebWorker = (typeof importScripts === "function");

if (!isRunningInWebWorker)
{
// A wrapper interface around ImageData for storing paletted image data.
class IndexedImageData {
    #palette
    #width
    #height
    data

    constructor(width, height) {
        if (
            isNaN(width) ||
            isNaN(height)
        ){
            throw new Error("This interface supports only numeric 'width' and 'height' as arguments.");
        }

        this.#width = width;
        this.#height = height;
        this.data = new Array(width * height);
        this.palette = [[0, 0, 0, 0]];
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

        if (newPalette.length < 1) {
            throw new Error("A palette must consist of at least one color.");
        }

        if (!newPalette.every(element=>Array.isArray(element))) {
            throw new Error("Each entry in the palette must be a sub-array of color channel values.");
        }

        newPalette.forEach(color=>{
            color.length = 4;
            if (typeof color[3] === "undefined") {
                color[3] = 255;
            }
        });

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

// A wrapper interface around CanvasRenderingContext2D for manipulating the drawing surface
// of a <canvas> element using indexed colors.
class CanvasRenderingContextIndexed {
    #underlyingContext2D
    #underlyingImageData
    #width
    #height

    constructor(underlyingContext2D) {
        if (!(underlyingContext2D instanceof CanvasRenderingContext2D)) {
            throw new Error("CanvasRenderingContextIndexed requires an instance of CanvasRenderingContext2D as an argument.");
        }

        this.#underlyingContext2D = underlyingContext2D;
        this.#width = this.#underlyingContext2D.canvas.width;
        this.#height = this.#underlyingContext2D.canvas.height;
        this.#underlyingImageData = this.#underlyingContext2D.createImageData(this.#width, this.#height);
        this.#underlyingImageData.data.fill(0);

        if (
            isNaN(this.#width) ||
            isNaN(this.#height) ||
            (this.#height < 1) ||
            (this.#width < 1)
        ){
            throw new Error("Invalid context resolution.");
        }
    }
    
    createImageData(
        width = this.#width,
        height = this.#height
    )
    {
        if (width instanceof ImageData) {
            throw new Error("This interface supports only 'width' and 'height' as arguments.");
        }

        if (
            (width !== this.#width) ||
            (height !== this.#height)
        ){
            throw new Error("This interface can only create images whose resolution matches the size of the canvas.");
        }

        return new IndexedImageData(width, height);
    }

    // Returns as an ImageData object the RGBA/8888 pixel data as displayed on the canvas.
    getImageData() {
        return this.#underlyingImageData;
    }

    putImageData(indexedImage) {
        if (!(indexedImage instanceof IndexedImageData)) {
            throw new Error("Only images of type IndexedImageData can be rendered.");
        }

        if (
            (indexedImage.width !== this.#width) ||
            (indexedImage.height !== this.#height)
        ){
            throw new Error("Mismatched image resolution: images must be the size of the canvas.");
        }

        // Convert the paletted image into a 32-bit image on the canvas.
        {
            const palette = indexedImage.palette.dword;
            const pixelBuffer32bit = new Uint32Array(this.#underlyingImageData.data.buffer);

            for (let i = 0; i < indexedImage.data.length; i++) {
                pixelBuffer32bit[i] = palette[indexedImage.data[i]];
            }
        }

        this.#underlyingContext2D.putImageData(this.#underlyingImageData, 0, 0);
    }
}

class HTMLPalettedCanvasElement extends HTMLCanvasElement {
    #underlyingContext
    #indexedRenderingContext

    constructor() {
        super();
    }
    
    static get observedAttributes() {
        return ["width", "height"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((oldValue != newValue) && ["width", "height"].includes(name)) {
            this.#underlyingContext = super.getContext("2d");
            this.#indexedRenderingContext = new CanvasRenderingContextIndexed(this.#underlyingContext);
        }
    }

    getContext(contextType = "2d") {
        if (contextType !== "2d") {
            throw new Error("This interface only supports the '2d' context type.");
        }

        return this.#indexedRenderingContext;
    }
};

window.IndexedImageData = IndexedImageData;
window.CanvasRenderingContextIndexed = CanvasRenderingContextIndexed;
window.HTMLPalettedCanvasElement = HTMLPalettedCanvasElement;
customElements.define("paletted-canvas", HTMLPalettedCanvasElement, {extends: "canvas"});
}
