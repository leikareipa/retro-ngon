/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A surface for rendering onto. Will also paint the rendered image onto a HTML5 <canvas>
// element unless the 'canvasElementId' parameter is null, in which case rendering will be
// to an off-screen buffer only.
//
// Returns null if the surface could not be created.
Rngon.surface = function(canvasElement,  // The target DOM <canvas> element.
                         options = {})   // A reference to or copy of the options passed to render().
{
    const renderOffscreen = Boolean(canvasElement === null);

    let surfaceWidth = undefined,
        surfaceHeight = undefined,
        renderContext = undefined;

    try
    {
        if (renderOffscreen)
        {
            ({surfaceWidth, surfaceHeight} = setup_offscreen(options.width, options.height));
        }
        else
        {
            ({surfaceWidth,
              surfaceHeight,
              canvasElement,
              renderContext} = setup_onscreen(canvasElement, options.scale));
        }
        
        initialize_internal_surface_state(surfaceWidth, surfaceHeight);
    }
    catch (error)
    {
        Rngon.log(`Failed to create a render surface. ${error}`);
        return null;
    }

    const cameraMatrix = Rngon.matrix44.multiply(Rngon.matrix44.rotation(options.cameraDirection.x,
                                                                         options.cameraDirection.y,
                                                                         options.cameraDirection.z),
                                                 Rngon.matrix44.translation(-options.cameraPosition.x,
                                                                            -options.cameraPosition.y,
                                                                            -options.cameraPosition.z));
    const perspectiveMatrix = Rngon.matrix44.perspective((options.fov * Math.PI/180),
                                                         (surfaceWidth / surfaceHeight),
                                                         options.nearPlane,
                                                         options.farPlane);
    const screenSpaceMatrix = Rngon.matrix44.ortho((surfaceWidth + 1), (surfaceHeight + 1));

    const publicInterface = Object.freeze(
    {
        width: surfaceWidth,
        height: surfaceHeight,

        // Rasterizes the given meshes' n-gons onto this surface. Following this call,
        // the rasterized pixels will be in Rngon.internalState.pixelBuffer, and the
        // meshes' n-gons - with their vertices transformed to screen space - in
        // Rngon.internalState.ngonCache. If a <canvas> element id was specified for
        // this surface, the rasterized pixels will also be painted onto that canvas.
        display_meshes: function(meshes = [])
        {
            Rngon.internalState.modules.surface_wipe();

            // Prepare the meshes' n-gons for rendering. This will place the transformed
            // n-gons into the internal n-gon cache, Rngon.internalState.ngonCache.
            {
                Rngon.renderShared.prepare_ngon_cache(meshes);

                for (const mesh of meshes)
                {
                    Rngon.internalState.modules.transform_clip_light(
                        mesh.ngons,
                        Rngon.mesh.object_space_matrix(mesh),
                        cameraMatrix,
                        perspectiveMatrix,
                        screenSpaceMatrix,
                        options.cameraPosition);
                };

                Rngon.renderShared.mark_npot_textures_in_ngon_cache();
                Rngon.renderShared.depth_sort_ngon_cache(options.depthSort);
            }

            // Render the n-gons from the n-gon cache. The rendering will go into the
            // renderer's internal pixel buffer, Rngon.internalState.pixelBuffer.
            {
                Rngon.internalState.modules.ngon_fill(options.auxiliaryBuffers);

                if (Rngon.internalState.usePixelShader)
                {
                    const args = {
                        renderWidth: surfaceWidth,
                        renderHeight: surfaceHeight,
                        fragmentBuffer: Rngon.internalState.fragmentBuffer.data,
                        pixelBuffer: Rngon.internalState.pixelBuffer.data,
                        ngonCache: Rngon.internalState.ngonCache.ngons,
                        cameraPosition: options.cameraPosition,
                    };

                    const paramNamesString = `{${Object.keys(args).join(",")}}`;

                    switch (typeof Rngon.internalState.pixel_shader)
                    {
                        case "function":
                        {
                            Rngon.internalState.pixel_shader(args);
                            break;
                        }
                        // Shader functions as strings are supported to allow shaders to be
                        // used in Web Workers. These strings are expected to be of - or
                        // equivalent to - the form "(a)=>{console.log(a)}".
                        case "string":
                        {
                            Function(paramNamesString, `(${Rngon.internalState.pixel_shader})(${paramNamesString})`)(args);
                            break;
                        }
                        default:
                        {
                            Rngon.throw("Unrecognized type of pixel shader function.");
                            break;
                        }
                    }
                }

                if (!renderOffscreen)
                {
                    renderContext.putImageData(Rngon.internalState.pixelBuffer, 0, 0);
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

            return Boolean((containerRect.top > -containerRect.height) &&
                           (containerRect.top < viewHeight));
        },
    });

    return publicInterface;

    // Initializes the internal render buffers if they're not already in a
    // suitable state.
    function initialize_internal_surface_state(surfaceWidth, surfaceHeight)
    {
        if ((Rngon.internalState.pixelBuffer.width != surfaceWidth) ||
            (Rngon.internalState.pixelBuffer.height != surfaceHeight))
        {
            Rngon.internalState.pixelBuffer = new ImageData(surfaceWidth, surfaceHeight);
        }

        if ( Rngon.internalState.usePixelShader &&
            (Rngon.internalState.fragmentBuffer.width != surfaceWidth) ||
            (Rngon.internalState.fragmentBuffer.height != surfaceHeight))
        {
            Rngon.internalState.fragmentBuffer.width = surfaceWidth;
            Rngon.internalState.fragmentBuffer.height = surfaceHeight;
            Rngon.internalState.fragmentBuffer.data = new Array(surfaceWidth * surfaceHeight)
                                                      .fill()
                                                      .map(e=>({}));
        }

        if ( Rngon.internalState.useDepthBuffer &&
            (Rngon.internalState.depthBuffer.width != surfaceWidth) ||
            (Rngon.internalState.depthBuffer.height != surfaceHeight) ||
            !Rngon.internalState.depthBuffer.data.length)
        {
            Rngon.internalState.depthBuffer.width = surfaceWidth;
            Rngon.internalState.depthBuffer.height = surfaceHeight;
            Rngon.internalState.depthBuffer.data = new Array(Rngon.internalState.depthBuffer.width *
                                                             Rngon.internalState.depthBuffer.height); 
        }

        return;
    }

    // Initializes the target DOM <canvas> element for rendering into. Throws on errors.
    function setup_onscreen(canvasElement, scale)
    {
        Rngon.assert && (canvasElement instanceof Element)
                     || Rngon.throw("Can't find the given canvas element.");

        const renderContext = canvasElement.getContext("2d");

        Rngon.assert && (renderContext instanceof CanvasRenderingContext2D)
                     || Rngon.throw("Couldn't establish a canvas render context.");

        // Size the canvas as per the requested render scale.
        const surfaceWidth = Rngon.renderable_width_of(canvasElement, scale);
        const surfaceHeight = Rngon.renderable_height_of(canvasElement, scale);
        {
            Rngon.assert && ((surfaceWidth > 0) &&
                             (surfaceHeight > 0))
                         || Rngon.throw("Couldn't retrieve the canvas's dimensions.");

            canvasElement.setAttribute("width", surfaceWidth);
            canvasElement.setAttribute("height", surfaceHeight);
        }

        return {
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            renderContext};
    }

    // Sets up rendering into an off-screen buffer, i.e. without using a DOM <canvas>
    // element. Right now, since the renderer by default renders into an off-screen
    // buffer first and then transfers the pixels onto a <canvas>, this function
    // is more about just skipping initialization of the <canvas> element.
    //
    // Note: This function should throw on errors.
    function setup_offscreen(width, height)
    {
        return {
            surfaceWidth: width,
            surfaceHeight: height,
        };
    }
}

// Resets the surface's render buffers to their initial contents.
Rngon.surface.wipe = function()
{
    Rngon.internalState.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (Rngon.internalState.useDepthBuffer)
    {
        Rngon.internalState.depthBuffer.data.fill(Rngon.internalState.depthBuffer.clearValue);
    }

    return;
}
