/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Renders the given meshes onto a DOM <canvas> element by the given id. The
// <canvas> element must already exist.
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

    options = Object.freeze({
        ...Rngon.renderShared.defaultRenderOptions,
        ...options
    });
    
    Rngon.renderShared.initialize_internal_render_state(options);
    
    // Render a single frame onto the target <canvas> element.
    {
        const renderSurface = Rngon.surface(canvasElementId, options);

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (renderSurface &&
            (!options.hibernateWhenNotOnScreen || renderSurface.is_in_view()))
        {
            renderSurface.display_meshes(meshes);

            callMetadata.renderWidth = renderSurface.width;
            callMetadata.renderHeight = renderSurface.height;
            callMetadata.numNgonsRendered = Rngon.internalState.ngonCache.count;
        }
    }

    callMetadata.totalRenderTimeMs = (performance.now() - callMetadata.totalRenderTimeMs);

    return callMetadata;
};
