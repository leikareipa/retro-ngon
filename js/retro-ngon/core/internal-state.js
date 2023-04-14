/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

export function state(id = "default") {
    return (state[id] || (state[id] = default_state()));
};

state.active = default_state();

// Global app state, for internal use by the renderer. Unless otherwise noted, these
// parameters should not be modified directly; they're instead set by the renderer
// based on settings requested by the user.
function default_state() {
    return {
        // Modules provide core renderer functionality in overridable packages (the
        // user can provide custom modules to be used in place of the default ones).
        // Each module is a function that performs a set of tasks.
        modules: {
            // Transforms the given n-gons into screen space, placing the transformed
            // n-gons into the internal n-gon cache. Also applies lighting and viewport
            // clipping.
            transform_clip_light: undefined,
            
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
        useFragmentBuffer: false,
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

        usePerspectiveCorrectInterpolation: false,

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
            vertices:[],
        },

        // All light sources that should currently apply to n-gons passed to render().
        lights: [],
    }
}
