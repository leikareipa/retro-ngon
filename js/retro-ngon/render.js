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
    const renderCallInfo = Rngon.renderShared.setup_render_call_info();

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

            renderCallInfo.renderWidth = renderSurface.width;
            renderCallInfo.renderHeight = renderSurface.height;
            renderCallInfo.numNgonsRendered = Rngon.internalState.ngonCache.count;
        }
    }

    renderCallInfo.totalRenderTimeMs = (performance.now() - renderCallInfo.totalRenderTimeMs);

    return renderCallInfo;
};
