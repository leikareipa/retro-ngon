/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A surface for rendering onto. Will map onto a HTML5 <canvas> element unless the
// 'canvasElementId' parameter is null, in which case rendering will be to an
// off-screen buffer only.
//
// Note: Throws on unrecoverable errors; returns null if the surface size would be
// <= 0 in width and/or height.
Rngon.surface = function(canvasElementId = "",              // The DOM id of the target <canvas> element.
                         options = {})                      // A reference to or copy of the options passed to render().
{
    const renderOffscreen = Boolean(canvasElementId === null);

    if (renderOffscreen)
    {
        var {surfaceWidth,
             surfaceHeight} = setup_offscreen(options.width, options.height);
    }
    else
    {
        var {surfaceWidth,
             surfaceHeight,
             canvasElement,
             renderContext} = setup_onscreen(canvasElementId, options.scale);
    }
    
    // Initialize the internal render buffers if they're not already in a suitable
    // state.
    {
        if ((Rngon.internalState.pixelBuffer.width != surfaceWidth) ||
            (Rngon.internalState.pixelBuffer.height != surfaceHeight))
        {
            Rngon.internalState.pixelBuffer = new ImageData(surfaceWidth, surfaceHeight);
        }

        if ( Rngon.internalState.usePixelShaders &&
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
    }

    const cameraRotationMatrix = Rngon.matrix44.rotation(options.cameraDirection.x,
                                                         options.cameraDirection.y,
                                                         options.cameraDirection.z);
    const cameraPositionMatrix = Rngon.matrix44.translation(-options.cameraPosition.x,
                                                            -options.cameraPosition.y,
                                                            -options.cameraPosition.z);
    const perspectiveMatrix = Rngon.matrix44.perspective((options.fov * Math.PI/180),
                                                         (surfaceWidth / surfaceHeight),
                                                         options.nearPlane,
                                                         options.farPlane);
    const screenSpaceMatrix = Rngon.matrix44.ortho((surfaceWidth + 1), (surfaceHeight + 1));
    const cameraMatrix = Rngon.matrix44.multiply(cameraRotationMatrix, cameraPositionMatrix);

    const publicInterface =
    {
        width: surfaceWidth,
        height: surfaceHeight,

        // Rasterizes the given meshes' n-gons onto this surface.
        render_meshes: function(meshes = [])
        {
            // Prepare the meshes' n-gons for rendering. This will place the transformed
            // n-gons into the internal n-gon cache, Rngon.internalState.ngonCache.
            {
                // Transform the n-gons into screen space.
                for (const mesh of meshes)
                {
                    Rngon.ngon_transform_and_light(mesh.ngons,
                                                   Rngon.mesh.object_space_matrix(mesh),
                                                   cameraMatrix,
                                                   perspectiveMatrix,
                                                   screenSpaceMatrix,
                                                   options.cameraPosition);
                };

                mark_npot_textures_in_ngon_cache();
                depth_sort_ngon_cache(options.depthSort);
            }

            // Render the n-gons from the n-gon cache. The rendering will go into the
            // renderer's internal pixel buffer, Rngon.internalState.pixelBuffer.
            {
                this.wipe();

                Rngon.ngon_filler(options.auxiliaryBuffers);

                if (Rngon.internalState.usePixelShaders)
                {
                    Rngon.internalState.pixel_shader_function({
                        renderWidth: surfaceWidth,
                        renderHeight: surfaceHeight,
                        fragmentBuffer: Rngon.internalState.fragmentBuffer.data,
                        pixelBuffer: Rngon.internalState.pixelBuffer.data,
                        ngonCache: Rngon.internalState.ngonCache.ngons,
                        cameraPosition: options.cameraPosition,
                    });
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

        // Resets the surface's render buffers to their initial contents.
        wipe: function()
        {
            Rngon.internalState.pixelBuffer.data.fill(0);

            /// TODO: Wipe the fragment buffer.

            if (Rngon.internalState.useDepthBuffer)
            {
                Rngon.internalState.depthBuffer.data.fill(Rngon.internalState.depthBuffer.clearValue);
            }

            return;
        },
    };

    return publicInterface;

    /// TODO: This should maybe be moved to a more suitable source file.
    function depth_sort_ngon_cache(depthSortinMode = "")
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
    }

    // Mark any non-power-of-two affine-mapped faces as using the non-power-of-two affine
    // mapper, as the default affine mapper expects textures to be power-of-two.
    /// TODO: This should maybe be moved to a more suitable source file.
    function mark_npot_textures_in_ngon_cache()
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
    }

    // Initializes the target DOM <canvas> element for rendering into.
    function setup_onscreen(canvasElementId, scale)
    {
        const canvasElement = document.getElementById(canvasElementId);
        Rngon.assert && (canvasElement instanceof Element)
                    || Rngon.throw("Can't find the given canvas element.");

        const renderContext = canvasElement.getContext("2d");

        // Size the canvas as per the requested render scale.
        const surfaceWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * scale);
        const surfaceHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * scale);
        {
            Rngon.assert && (!isNaN(surfaceWidth) &&
                            !isNaN(surfaceHeight))
                        || Rngon.throw("Failed to extract the canvas size.");

            if ((surfaceWidth <= 0) ||
                (surfaceHeight <= 0))
            {
                return null;
            }

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
    function setup_offscreen(width, height)
    {
        return {
            surfaceWidth: width,
            surfaceHeight: height,
        };
    }
}
