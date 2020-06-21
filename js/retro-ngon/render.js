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
    options = Object.freeze({
        ...Rngon.render.defaultOptions,
        ...options
    });

    // Modify any internal render parameters based on the user's options.
    Rngon.internalState.useShaders = (typeof options.shaderFunction === "function");
    Rngon.internalState.useDepthBuffer = (options.useDepthBuffer == true);
    Rngon.internalState.showGlobalWireframe = (options.globalWireframe == true);
    Rngon.internalState.applyViewportClipping = (options.clipToViewport == true);
    Rngon.internalState.usePerspectiveCorrectInterpolation = ((options.perspectiveCorrectTexturing || // <- Name in pre-beta.2.
                                                               options.perspectiveCorrectInterpolation) == true);
    Rngon.internalState.lights = options.lights;
    Rngon.internalState.farPlaneDistance = options.farPlane;
    Rngon.internalState.viewPosition = options.cameraPosition;

    // Render a single frame onto the render surface.
    if ((!options.hibernateWhenNotOnScreen || is_surface_in_view()))
    {
        const renderSurface = Rngon.screen(canvasElementId,
                                           Rngon.ngon_filler,
                                           Rngon.ngon_transform_and_light,
                                           options.shaderFunction,
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

        callMetadata.numNgonsRendered = Rngon.internalState.transformedNgonsCache.count;
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

        ngonCache.count = 0;

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
            renderSurface.transform_and_light_ngons(mesh.ngons, Rngon.mesh.object_space_matrix(mesh), cameraMatrix, cameraPosition);
        };

        return;
    }

    // Mark any non-power-of-two affine-mapped faces as using the non-power-of-two affine
    // mapper, as the default affine mapper expects textures to be power-of-two.
    function mark_npot_textures(ngonCache = {})
    {
        for (let i = 0; i < ngonCache.count; i++)
        {
            const ngon = ngonCache.ngons[i];

            if (ngon.material.texture &&
                ngon.material.textureMapping === "affine")
            {
                let widthIsPOT = ((ngon.material.texture.width & (ngon.material.texture.width - 1)) === 0);
                let heightIsPOT = ((ngon.material.texture.height & (ngon.material.texture.height - 1)) === 0);

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
    }
};

Rngon.render.defaultOptions = 
{
    cameraPosition: Rngon.vector3(0, 0, 0),
    cameraDirection: Rngon.vector3(0, 0, 0),
    shaderFunction: null, // If null, all shader functionality will be disabled.
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
};
