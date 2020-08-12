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
        
        state.vertex_shader_function = options.vertexShaderFunction;
        state.useDepthBuffer = (options.useDepthBuffer == true);
        state.showGlobalWireframe = (options.globalWireframe == true);
        state.applyViewportClipping = (options.clipToViewport == true);
        state.lights = options.lights;
        state.farPlaneDistance = options.farPlane;
        state.useVertexShaders = (typeof options.vertexShaderFunction === "function");

        state.usePerspectiveCorrectInterpolation = ((options.perspectiveCorrectTexturing || // <- Name in pre-beta.2.
                                                     options.perspectiveCorrectInterpolation) == true);

        state.usePixelShaders = (typeof (options.shaderFunction || // <- Name in pre-beta.3.
                                         options.pixelShaderFunction) === "function");

        state.pixel_shader_function = (options.shaderFunction || // <- Name in pre-beta.3.
                                       options.pixelShaderFunction);

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

    defaultRenderOptions:
    {
        cameraPosition: Rngon.vector3(0, 0, 0),
        cameraDirection: Rngon.vector3(0, 0, 0),
        pixelShaderFunction: null, // If null, all pixel shader functionality will be disabled.
        vertexShaderFunction: null, // If null, all vertex shader functionality will be disabled.
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
        finishedCallback: null, // A function called by the renderer when rendering finishes. Only used by the async renderer.
    },
}
