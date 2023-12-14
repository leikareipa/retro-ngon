/*
 * 2020-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

export const defaultContextName = "default";

export function Context(id = undefined) {
    if (id === undefined) {
        id = defaultContextName;
    }
    return (Context.list[id] || (Context.list[id] = Context.instance()));
};

Context.instance = function() {
    return {
        $constructor: "Context",

        pipeline: {
            ngon_sorter: undefined,
            transform_clip_lighter: undefined,
            surface_wiper: undefined,
            rasterizer: undefined,
            vertex_shader: undefined,
            pixel_shader: undefined,
            canvas_shader: undefined,
            raster_path: undefined,
        },

        // The most recent output resolution.
        resolution: {
            width: undefined,
            height: undefined,
        },

        // Pixel buffer for rasterization. This will be scaled to match the requested
        // render resolution; and the renderer's rasterization pass will populate it
        // with the rendered frame's pixel values.
        pixelBuffer: undefined,

        // Typed array (Uint8ClampedArray, Uint32Array) views to the pixel buffer's data.
        pixelBuffer8: undefined,
        pixelBuffer32: undefined,

        // For each pixel in pixelBuffer, an associated depth value. The values are in
        // the range [0,1], where 0 corresponds to nearPlane and 1 to farPlane.
        useDepthBuffer: false,
        depthBuffer: {
            width: 0,
            height: 0,
            data: undefined,
            resize(width, height) {
                this.width = width;
                this.height = height;
                this.data = new Float64Array(width * height);
            },
            clear() {
                this.data.fill(1);
            }
        },

        // For each pixel in the rendered frame, metadata about the state of the renderer
        // at that pixel, intended to be used by pixel shaders.
        useFragmentBuffer: false,
        fragmentBuffer: {
            width: 0,
            height: 0,
            data: undefined,
            resize(width, height) {
                this.width = width;
                this.height = height;
                this.data = new Array(width * height).fill().map(_=>({}));
            },
        },

        // Determines which metadata are to be recorded in the fragment buffer.
        fragments: {
            ngon: true,
            textureUScaled: true,
            textureVScaled: true,
            shade: true,
            worldX: true,
            worldY: true,
            worldZ: true,
            normalX: true,
            normalY: true,
            normalZ: true,
        },

        // If true, enables the fragment buffer and allows the use of pixel shaders.
        usePixelShader: false,
        pixel_shader: undefined,

        useVertexShader: false,
        vertex_shader: undefined,

        useCanvasShader: false,
        canvas_shader: undefined,

        // A scalar for the internal render resolution. Values below 1 mean the image
        // will be rendered at a resolution lower than the display size, then upscaled.
        renderScale: undefined,

        useFullInterpolation: true,

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

        // An array containing the screen-space n-gons to be rasterized. The array is derived
        // from the n-gons passed to render(), following transformation and clipping.
        screenSpaceNgons: [],

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
            vertices: [],
        },

        // Pre-allocated memory; stores the vertex normals of the n-gon cache's n-gons.
        vertexNormalCache: {
            count: 0,
            normals: [],
        },

        // All light sources that should currently apply to n-gons passed to render().
        lights: [],
    }
}

Context.list = {
    [defaultContextName]: Context.instance(),
};
