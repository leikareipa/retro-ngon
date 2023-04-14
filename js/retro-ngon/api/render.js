/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

// Renders the given meshes onto a given DOM <canvas> element (ote that the target element
// must already exist). If a null target is given, the image will be rendered into an
// offscreen pixel buffer, accessible after this call via Rngon.state.active.pixelBuffer.
export function render({
    target = null,
    scene = [Rngon.mesh()],
    options = {},
    pipeline = {},
} = {})
{
    const renderCallInfo = Rngon.renderShared.setup_render_call_info();

    options = Object.freeze({
        ...Rngon.renderShared.defaultRenderOptions,
        ...options
    });

    pipeline = Object.freeze({
        ...Rngon.renderShared.defaultRenderPipeline,
        ...pipeline
    });

    Rngon.renderShared.initialize_internal_render_state(options, pipeline);

    // The canvas element can be passed in in a couple of ways, e.g. as a string that
    // identifies the DOM element, or directly as a DOM element object. So let's figure
    // out what we received, and turn it into a DOM element object for the renderer
    // to operate on.
    if (typeof target === "string")
    {
        target = document.getElementById(target);
    }

    Rngon.assert?.(
        ((target === null) ||
         (target instanceof HTMLCanvasElement)),
        "Invalid canvas element for rendering into."
    );

    Rngon.assert?.(
        (!Rngon.state.active.usePalette || (target instanceof HTMLPalettedCanvasElement)),
        "For paletted rendering, the attribute is='paletted-canvas' must be present on the target <canvas>."
    );
    
    // Render a single frame onto the target <canvas> element.
    {
        const renderSurface = Rngon.surface(target, options);

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (renderSurface &&
            (!options.hibernateWhenTargetNotVisible || renderSurface.is_in_view()))
        {
            renderSurface.display_meshes(scene);

            renderCallInfo.renderWidth = renderSurface.width;
            renderCallInfo.renderHeight = renderSurface.height;
            renderCallInfo.numNgonsRendered = Rngon.state.active.ngonCache.count;
        }
    }

    renderCallInfo.totalRenderTimeMs = (performance.now() - renderCallInfo.totalRenderTimeMs);

    return renderCallInfo;
};
