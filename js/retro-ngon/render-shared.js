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

        state.modules.ngon_fill = (options.modules.ngonFill || Rngon.rasterize);
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
            ngonFill: null, // Null defaults to Rngon.rasterize.
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
