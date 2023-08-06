/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

export function state(id = "default") {
    return (state[id] || (state[id] = default_state()));
};

state.default = default_state();

// Global app state, for internal use by the renderer. Unless otherwise noted, these
// parameters should not be modified directly; they're instead set by the renderer
// based on settings requested by the user.
function default_state() {
    return {
        // Modules provide core renderer functionality in overridable packages (the
        // user can provide custom modules to be used in place of the default ones).
        // Each module is a function that performs a set of tasks.
        modules: {
            transform_clip_lighter: undefined,
            surface_wiper: undefined,
            rasterizer: undefined,
            vertex_shader: undefined,
            pixel_shader: undefined,
            context_shader: undefined,
            raster_shader: undefined,
        },

        // Pixel buffer for rasterization. This will be scaled to match the requested
        // render resolution; and the renderer's rasterization pass will populate it
        // with the rendered frame's pixel values.
        pixelBuffer: new ImageData(1, 1),

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
            w: true,
            ngonIdx: true,
            textureUScaled: true,
            textureVScaled: true,
            depth: true,
            shade: true,
            worldX: true,
            worldY: true,
            worldZ: true,
        },

        // If true, enables the fragment buffer and allows the use of pixel shaders.
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

        usePerspectiveInterpolation: true,

        // If set to true, all n-gons will be rendered with a wireframe.
        showGlobalWireframe: false,

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
            vertices: [],
        },

        // All light sources that should currently apply to n-gons passed to render().
        lights: [],
    }
}
