/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

// Functionality that may be shared between different implementations of Rngon.render()
// and perhaps called by other subsystems, like Rngon.surface().
export const renderShared = {
    initialize_internal_render_state: function(options = {}, pipeline = {})
    {
        const state = (Rngon.state.active = Rngon.state(options.state));

        state.useDepthBuffer = Boolean(options.useDepthBuffer);
        state.showGlobalWireframe = Boolean(options.globalWireframe);
        state.lights = options.lights;

        state.renderScale = (
            (typeof options.resolution === "number")
                ? options.resolution
                : 1 // Will use options.width and options.height instead.
        );
        state.offscreenRenderWidth = options.width;
        state.offscreenRenderHeight = options.height;

        state.nearPlaneDistance = options.nearPlane;
        state.farPlaneDistance = options.farPlane;

        state.fov = options.fov;
        state.cameraDirection = options.cameraDirection;
        state.cameraPosition = options.cameraPosition;

        state.usePerspectiveInterpolation = Boolean(options.usePerspectiveInterpolation);

        state.useFragmentBuffer = Boolean(
            options.useFragmentBuffer ||
            // Detect whether the shader function's parameter list includes the fragment buffer.
            // Note that this doesn't always work, e.g. when the function has been .bind()ed.
            (state.usePixelShader && state.pixel_shader?.toString().match(/{(.+)?}/)[1].includes("fragmentBuffer"))
        );

        state.usePalette = Array.isArray(options.palette);
        state.palette = options.palette;

        state.modules.rasterize = (
            (typeof pipeline.rasterizer === "function")
                ? pipeline.rasterizer
                : (pipeline.rasterizer === null)
                    ? null
                    : Rngon.defaultPipeline.rasterizer
        );

        state.modules.transform_clip_light = (
            (typeof pipeline.transformClipLighter === "function")
                ? pipeline.transformClipLighter
                : (pipeline.transformClipLighter === null)
                    ? null
                    : Rngon.defaultPipeline.transform_clip_lighter
        );

        state.modules.surface_wipe = (
            (typeof pipeline.surfaceWiper === "function")
                ? pipeline.surfaceWiper
                : (pipeline.surfaceWiper === null)
                    ? null
                    : Rngon.defaultPipeline.surface_wiper
        );

        state.usePixelShader = Boolean(pipeline.pixelShader);
        state.modules.pixel_shader = (
            (typeof pipeline.pixelShader === "function")
                ? pipeline.pixelShader
                : (pipeline.pixelShader === null)
                    ? null
                    : null /// TODO: Default pixel shader here.
        );

        state.useVertexShader = Boolean(pipeline.vertexShader);
        state.modules.vertex_shader = (
            (typeof pipeline.vertexShader === "function")
                ? pipeline.vertexShader
                : (pipeline.vertexShader === null)
                    ? null
                    : null /// TODO: Default vertex shader here.
        );

        state.useContextShader = Boolean(pipeline.contextShader);
        state.modules.context_shader = (
            (typeof pipeline.contextShader === "function")
                ? pipeline.contextShader
                : (pipeline.contextShader === null)
                    ? null
                    : null /// TODO: Default context shader here.
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

        const ngonCache = Rngon.state.active.ngonCache;
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

        const vertexCache = Rngon.state.active.vertexCache;
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

    // Marks any non-power-of-two affine-mapped faces in the n-gon cache as using the
    // non-power-of-two affine texture mapper. This needs to be done since the default
    // affine mapper expects textures to be power-of-two.
    mark_npot_textures_in_ngon_cache: function()
    {
        for (let i = 0; i < Rngon.state.active.ngonCache.count; i++)
        {
            const ngon = Rngon.state.active.ngonCache.ngons[i];

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
    get defaultRenderOptions() {
        return {
            cameraPosition: Rngon.vector(0, 0, 0),
            cameraDirection: Rngon.vector(0, 0, 0),
            state: undefined,
            resolution: 0.5,
            fov: 43,
            nearPlane: 1,
            farPlane: 1000,
            useDepthBuffer: true,
            useFragmentBuffer: false,
            usePerspectiveInterpolation: true,
            globalWireframe: false,
            hibernateWhenTargetNotVisible: true,
            lights: [],
            width: 640,
            height: 480,
            palette: null,
        };
    },

    // (See the root README.md for documentation on these parameters.)
    get defaultRenderPipeline() {
        return {
            surfaceWipe: undefined,
            rasterize: undefined,
            transformClipLighter: undefined,
            pixelShader: null,
            vertexShader: null,
            contextShader: null,
        };
    },

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
