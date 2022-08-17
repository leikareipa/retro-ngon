/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

// Renders the given meshes onto a given DOM <canvas> element. Note that the target element
// must already exist.
export function render(
    target,
    meshes = [Rngon.mesh()],
    options = {}
)
{
    const renderCallInfo = Rngon.renderShared.setup_render_call_info();

    options = Object.freeze({
        ...Rngon.renderShared.defaultRenderOptions,
        ...options
    });

    Rngon.renderShared.initialize_internal_render_state(options);

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
        (!Rngon.internalState.usePalette || (target instanceof HTMLPalettedCanvasElement)),
        "For paletted rendering, the attribute is='paletted-canvas' must be present on the target <canvas>."
    );
    
    // Render a single frame onto the target <canvas> element.
    {
        const renderSurface = Rngon.surface(target, options);

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
