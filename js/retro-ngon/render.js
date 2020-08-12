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

    options = {
        ...Rngon.renderShared.defaultRenderOptions,
        ...options
    };
    
    Rngon.renderShared.set_internal_render_state(options);
    
    // Render a single frame into the target canvas.
    {
        const renderSurface = Rngon.surface(canvasElementId,
                                            Rngon.ngon_filler,
                                            Rngon.ngon_transform_and_light,
                                            options);

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (renderSurface &&
            (!options.hibernateWhenNotOnScreen || renderSurface.is_in_view()))
        {
            Rngon.renderShared.prepare_ngon_cache(meshes);
            renderSurface.render_meshes(meshes);

            callMetadata.renderWidth = renderSurface.width;
            callMetadata.renderHeight = renderSurface.height;
            callMetadata.numNgonsRendered = Rngon.internalState.ngonCache.count;
        }
    }

    callMetadata.totalRenderTimeMs = (performance.now() - callMetadata.totalRenderTimeMs);

    return callMetadata;
};
