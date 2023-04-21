/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

// A surface for rendering onto. Will also paint the rendered image onto a HTML5 <canvas>
// element unless the 'canvasElement' parameter is null, in which case rendering will be
// to an off-screen buffer only.
//
// Returns null if the surface could not be created.
export function surface(canvasElement)
{
    const state = Rngon.state.active;
    const renderOffscreen = (canvasElement === null);

    let surfaceWidth = undefined,
        surfaceHeight = undefined,
        renderContext = undefined;

    try
    {
        ({
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            renderContext
        } = (renderOffscreen? setup_offscreen : setup_onscreen)());

        initialize_internal_surface_state();
    }
    catch (error)
    {
        console.error(error);
        return null;
    }

    const cameraMatrix = Rngon.matrix44.multiply(
        Rngon.matrix44.rotation(
            state.cameraDirection.x,
            state.cameraDirection.y,
            state.cameraDirection.z
        ),
        Rngon.matrix44.translation(
            -state.cameraPosition.x,
            -state.cameraPosition.y,
            -state.cameraPosition.z
        )
    );

    const perspectiveMatrix = Rngon.matrix44.perspective(
        (state.fov * (Math.PI / 180)),
        (surfaceWidth / surfaceHeight),
        state.nearPlaneDistance,
        state.farPlaneDistance
    );

    const screenSpaceMatrix = Rngon.matrix44.ortho(
        (surfaceWidth + 1),
        (surfaceHeight + 1)
    );

    const publicInterface = Object.freeze(
    {
        width: surfaceWidth,
        height: surfaceHeight,

        // Rasterizes the given meshes' n-gons onto this surface. Following this call,
        // the rasterized pixels will be in Rngon.state.active.pixelBuffer, and the
        // meshes' n-gons - with their vertices transformed to screen space - in
        // Rngon.state.active.ngonCache. If a <canvas> element id was specified for
        // this surface, the rasterized pixels will also be painted onto that canvas.
        display_meshes: function(meshes = [])
        {
            state.modules.surface_wipe?.();

            // Prepare the meshes' n-gons for rendering. This will place the transformed
            // n-gons into the internal n-gon cache, Rngon.state.active.ngonCache.
            {
                Rngon.renderShared.prepare_vertex_cache(meshes);
                Rngon.renderShared.prepare_ngon_cache(meshes);

                if (state.modules.transform_clip_light)
                {
                    for (const mesh of meshes)
                    {
                        state.modules.transform_clip_light(
                            mesh.ngons,
                            Rngon.mesh.object_space_matrix(mesh),
                            cameraMatrix,
                            perspectiveMatrix,
                            screenSpaceMatrix,
                            state.cameraPosition
                        );
                    };
                }

                // When using a depth buffer, we can get better performance by pre-sorting
                // the n-gons in reverse painter order, where the closest n-gons are rendered
                // first, as it allows for early discarding of occluded pixels.
                if (state.useDepthBuffer)
                {
                    state.ngonCache.ngons.sort((ngonA, ngonB)=>
                    {
                        // Separate inactive n-gons (which are to be ignored when rendering the current
                        // frame) from the n-gons we're intended to render.
                        const a = (ngonA.isActive? (ngonA.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonA.vertices.length) : Number.MAX_VALUE);
                        const b = (ngonB.isActive? (ngonB.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonB.vertices.length) : Number.MAX_VALUE);
                        return ((a === b)? 0 : ((a > b)? 1 : -1));
                    });
                }

                Rngon.renderShared.mark_npot_textures_in_ngon_cache();
            }

            // Render the n-gons from the n-gon cache into the pixel buffer, Rngon.state.active.pixelBuffer.
            state.modules.rasterize?.();

            // Apply a custom pixel shader effect on the renderer's pixel buffer in
            // Rngon.state.active.pixelBuffer.
            if (state.usePixelShader)
            {
                const args = {
                    renderWidth: surfaceWidth,
                    renderHeight: surfaceHeight,
                    fragmentBuffer: state.fragmentBuffer.data,
                    pixelBuffer: state.pixelBuffer.data,
                    ngonCache: state.ngonCache.ngons,
                    cameraPosition: state.cameraPosition,
                };

                const paramNamesString = `{${Object.keys(args).join(",")}}`;

                switch (typeof state.modules.pixel_shader)
                {
                    case "function": {
                        state.modules.pixel_shader(args);
                        break;
                    }
                    // Shader functions as strings are supported to allow shaders to be
                    // used in Web Workers. These strings are expected to be of - or
                    // equivalent to - the form "(a)=>{console.log(a)}".
                    case "string": {
                        Function(paramNamesString, `(${state.modules.pixel_shader})(${paramNamesString})`)(args);
                        break;
                    }
                    default: {
                        Rngon.$throw("Unrecognized type of pixel shader function.");
                        break;
                    }
                }
            }

            if (!renderOffscreen)
            {
                if (state.useContextShader)
                {
                    state.modules.context_shader({
                        context: renderContext,
                        image: state.pixelBuffer,
                    });
                }
                else
                {
                    renderContext.putImageData(state.pixelBuffer, 0, 0);
                }
            }
        },

        // Returns true if any horizontal part of the surface's DOM canvas is within
        // the page's visible region.
        is_in_view: function()
        {
            // Offscreen rendering is always 'in view' in the sense that it doesn't
            // have a physical manifestation in the DOM that could go out of view to
            // begin with. Technically this could maybe be made to return false to
            // indicate that the offscreen buffer is for some reason uinavailable,
            // but for now we don't do that.
            if (renderOffscreen)
            {
                return true;
            }

            const viewHeight = window.innerHeight;
            const containerRect = canvasElement.getBoundingClientRect();

            return (
                (containerRect.top > -containerRect.height) &&
                (containerRect.top < viewHeight)
            );
        },
    });

    return publicInterface;

    // Initializes the internal render buffers if they're not already in a suitable state.
    function initialize_internal_surface_state()
    {
        if (
            (state.pixelBuffer.width != surfaceWidth) ||
            (state.pixelBuffer.height != surfaceHeight)
        ){
            state.pixelBuffer = renderContext.createImageData(surfaceWidth, surfaceHeight);
        }

        if (
            state.useFragmentBuffer &&
            ((state.fragmentBuffer.width != surfaceWidth) ||
             (state.fragmentBuffer.height != surfaceHeight))
        ){
            state.fragmentBuffer.width = surfaceWidth;
            state.fragmentBuffer.height = surfaceHeight;
            state.fragmentBuffer.data = new Array(surfaceWidth * surfaceHeight).fill().map(e=>({}));
        }

        if (
            state.useDepthBuffer &&
            ((state.depthBuffer.width != surfaceWidth) ||
             (state.depthBuffer.height != surfaceHeight) ||
             !state.depthBuffer.data.length)
        ){
            state.depthBuffer.width = surfaceWidth;
            state.depthBuffer.height = surfaceHeight;
            state.depthBuffer.data = new Array(state.depthBuffer.width * state.depthBuffer.height); 
        }

        return;
    }

    // Initializes the target DOM <canvas> element for rendering into. Throws on errors.
    function setup_onscreen()
    {
        const renderContext = canvasElement?.getContext("2d");

        Rngon.assert?.(
            ((canvasElement instanceof Element) && renderContext),
            "Invalid canvas element."
        );

        if (state.usePalette)
        {
            state.pixelBuffer.palette = state.palette;
        }

        // Size the canvas as per the requested render scale.
        const surfaceWidth = Rngon.renderable_width_of(canvasElement, state.renderScale);
        const surfaceHeight = Rngon.renderable_height_of(canvasElement, state.renderScale);
        Rngon.assert?.(
            ((surfaceWidth > 0) && (surfaceHeight > 0)),
            "Failed to query the dimensions of the canvas."
        );
        canvasElement.setAttribute("width", surfaceWidth);
        canvasElement.setAttribute("height", surfaceHeight);

        return {
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            renderContext
        };
    }

    // Sets up rendering into an off-screen buffer, i.e. without using a DOM <canvas>
    // element. Right now, since the renderer by default renders into an off-screen
    // buffer first and then transfers the pixels onto a <canvas>, this function
    // is more about just skipping initialization of the <canvas> element.
    //
    // Note: This function should throw on errors.
    function setup_offscreen()
    {
        return {
            surfaceWidth: state.offscreenRenderWidth,
            surfaceHeight: state.offscreenRenderHeight,
            renderContext: {
                createImageData: function(width, height)
                {
                    return new ImageData(width, height);
                },
            },
        };
    }
}
