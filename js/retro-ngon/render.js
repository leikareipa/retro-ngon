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
    options = Object.freeze(
    {
        ...Rngon.render.defaultOptions,
        ...options
    });

    // Modify any internal render parameters based on the user's options.
    Rngon.internalState.useDepthBuffer = (options.depthSort === "depthbuffer");
    Rngon.internalState.showGlobalWireframe = (options.globalWireframe === true);
    Rngon.internalState.applyViewportClipping = (options.clipToViewport === true);
    Rngon.internalState.usePerspectiveCorrectTexturing = (options.perspectiveCorrectTexturing === true);

    // Create or resize the n-gon cache to fit at least the number of n-gons that we've been
    // given to render.
    {
        const sceneNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

        if (!Rngon.internalState.transformedNgonsCache ||
            !Rngon.internalState.transformedNgonsCache.ngons.length ||
            (Rngon.internalState.transformedNgonsCache.ngons.length < sceneNgonCount))
        {
            const lengthDelta = (sceneNgonCount - Rngon.internalState.transformedNgonsCache.ngons.length);

            Rngon.internalState.transformedNgonsCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Rngon.ngon()));
        }

        Rngon.internalState.transformedNgonsCache.numActiveNgons = 0; 
    }

    // Render a single frame onto the render surface.
    if ((!options.hibernateWhenNotOnScreen || is_surface_in_view()))
    {
        const renderSurface = Rngon.screen(canvasElementId,
                                           Rngon.ngon_filler,
                                           Rngon.ngon_transformer,
                                           options.scale,
                                           options.fov,
                                           options.nearPlane,
                                           options.farPlane,
                                           options.auxiliaryBuffers);

        const ngonCache = Rngon.internalState.transformedNgonsCache;

        callMetadata.renderWidth = renderSurface.width;
        callMetadata.renderHeight = renderSurface.height;
    
        transform_ngons(meshes, renderSurface, options.cameraPosition, options.cameraDirection);
        mark_npot_textures(ngonCache);
        depth_sort_ngons(ngonCache.ngons, options.depthSort);

        renderSurface.wipe_clean();
        renderSurface.rasterize_ngon_cache();

        callMetadata.numNgonsRendered = ngonCache.numActiveNgons;
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

    function transform_ngons(meshes, renderSurface, cameraPosition, cameraDirection)
    {
        const cameraMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.rotate(cameraDirection.x,
                                                                                      cameraDirection.y,
                                                                                      cameraDirection.z),
                                                                Rngon.matrix44.translate(-cameraPosition.x,
                                                                                         -cameraPosition.y,
                                                                                         -cameraPosition.z));

        for (const mesh of meshes)
        {
            renderSurface.transform_ngons(mesh.ngons, mesh.objectSpaceMatrix(), cameraMatrix, cameraPosition);
        };

        return;
    }

    // Mark any non-power-of-two affine-mapped faces as using the non-power-of-two affine
    // mapper, as the default affine mapper expects textures to be power-of-two.
    function mark_npot_textures(ngonCache)
    {
        for (let i = 0; i < ngonCache.numActiveNgons; i++)
        {
            const ngon = ngonCache.ngons[i];

            if (ngon.material.texture &&
                ngon.material.textureMapping === "affine")
            {
                const widthIsPOT = ((ngon.material.texture.width & (ngon.material.texture.width - 1)) === 0);
                const heightIsPOT = ((ngon.material.texture.height & (ngon.material.texture.height - 1)) === 0);

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
    function depth_sort_ngons(ngons, depthSortingMode)
    {
        switch (depthSortingMode)
        {
            case "none": break;

            // Sort front-to-back; i.e. so that n-gons closest to the camera will be first in the
            // list. Together with the depth buffer, this allows early rejection of obscured polygons.
            case "depthbuffer":
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
            
            default: Rngon.throw("Unknown depth sort option."); break;
        }

        return;
    }
};

Rngon.render.defaultOptions = 
{
    cameraPosition: Rngon.vector3(0, 0, 0),
    cameraDirection: Rngon.vector3(0, 0, 0),
    scale: 1,
    fov: 43,
    nearPlane: 1,
    farPlane: 1000,
    depthSort: "painter",
    clipToViewport: true,
    globalWireframe: false,
    hibernateWhenNotOnScreen: true,
    perspectiveCorrectTexturing: false,
    auxiliaryBuffers: [],
};
