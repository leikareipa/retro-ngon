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
}
