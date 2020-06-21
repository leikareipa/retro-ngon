/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 * A surface for rendering onto. Maps onto a HTML5 canvas.
 *
 */

"use strict";

Rngon.screen = function(canvasElementId = "",              // The DOM id of the canvas element.
                        ngon_fill = ()=>{},                // A function that rasterizes the given ngons onto the canvas.
                        ngon_transform_and_light = ()=>{}, // A function applies lighting to the given ngons, and transforms them into screen-space for the canvas.
                        options = {})                      // Options that were passed to render().
{
    // Connect the render surface to the given canvas.
    const canvasElement = document.getElementById(canvasElementId);
    Rngon.assert && (canvasElement instanceof Element)
                 || Rngon.throw("Can't find the given canvas element.");
    const renderContext = canvasElement.getContext("2d");

    // Size the canvas as per the requested render scale.
    const screenWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * options.scale);
    const screenHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * options.scale);
    {
        Rngon.assert && (!isNaN(screenWidth) &&
                         !isNaN(screenHeight))
                     || Rngon.throw("Failed to extract the canvas size.");

        canvasElement.setAttribute("width", screenWidth);
        canvasElement.setAttribute("height", screenHeight);
    }

    const perspectiveMatrix = Rngon.matrix44.perspective((options.fov * Math.PI/180), (screenWidth / screenHeight), options.nearPlane, options.farPlane);
    const screenSpaceMatrix = Rngon.matrix44.ortho((screenWidth + 1), (screenHeight + 1));
    const cameraMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.rotate(options.cameraDirection.x,
                                                                                  options.cameraDirection.y,
                                                                                  options.cameraDirection.z),
                                                            Rngon.matrix44.translate(-options.cameraPosition.x,
                                                                                     -options.cameraPosition.y,
                                                                                     -options.cameraPosition.z));

    // Set up the internal render buffers.
    {
        if ((Rngon.internalState.pixelBuffer.width != screenWidth) ||
            (Rngon.internalState.pixelBuffer.height != screenHeight))
        {
            Rngon.internalState.pixelBuffer = new ImageData(screenWidth, screenHeight);
        }

        if (Rngon.internalState.useShaders &&
            (Rngon.internalState.fragmentBuffer.width != screenWidth) ||
            (Rngon.internalState.fragmentBuffer.height != screenHeight))
        {
            Rngon.internalState.fragmentBuffer.width = screenWidth;
            Rngon.internalState.fragmentBuffer.height = screenHeight;
            Rngon.internalState.fragmentBuffer.data = new Array(screenWidth * screenHeight)
                                                    .fill()
                                                    .map(e=>({}));
        }

        if (Rngon.internalState.useDepthBuffer &&
            (Rngon.internalState.depthBuffer.width != screenWidth) ||
            (Rngon.internalState.depthBuffer.height != screenHeight) ||
            !Rngon.internalState.depthBuffer.data.length)
        {
            Rngon.internalState.depthBuffer.width = screenWidth;
            Rngon.internalState.depthBuffer.height = screenHeight;
            Rngon.internalState.depthBuffer.data = new Array(Rngon.internalState.depthBuffer.width * Rngon.internalState.depthBuffer.height); 
        }
    }

    const publicInterface = Object.freeze(
    {
        width: screenWidth,
        height: screenHeight,

        render_meshes: function(meshes = [])
        {
            prepare_for_rasterization(meshes);
            rasterize_ngon_cache();
        },

        // Returns true if any horizontal part of the surface's DOM canvas is within
        // the page's visible region.
        is_in_view: function()
        {
            const viewHeight = window.innerHeight;
            const containerRect = canvasElement.getBoundingClientRect();

            return Boolean((containerRect.top > -containerRect.height) &&
                           (containerRect.top < viewHeight));
        },
    });

    return publicInterface;

    function wipe_clean()
    {
        Rngon.internalState.pixelBuffer.data.fill(0);

        /// TODO: Wipe the fragment buffer.

        if (Rngon.internalState.useDepthBuffer)
        {
            Rngon.internalState.depthBuffer.data.fill(Rngon.internalState.depthBuffer.clearValue);
        }
    }

    function copy_render_pixel_buffer()
    {
        renderContext.putImageData(Rngon.internalState.pixelBuffer, 0, 0);
    }

    /// TODO: Break this down into multiple functions.
    function prepare_for_rasterization(meshes = [])
    {
        // Transform into screen space.
        for (const mesh of meshes)
        {
            ngon_transform_and_light(mesh.ngons,
                                     Rngon.mesh.object_space_matrix(mesh),
                                     cameraMatrix,
                                     perspectiveMatrix,
                                     screenSpaceMatrix,
                                     options.cameraPosition);
        };

        // Mark any non-power-of-two affine-mapped faces as using the non-power-of-two affine
        // mapper, as the default affine mapper expects textures to be power-of-two.
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

        // Depth-sort the n-gons.
        {
            const ngons = Rngon.internalState.ngonCache.ngons;

            switch (options.depthSort)
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
        }
    }

    // Draw all n-gons currently stored in the internal n-gon cache onto the render surface.
    function rasterize_ngon_cache()
    {
        wipe_clean();

        ngon_fill(options.auxiliaryBuffers);

        if (Rngon.internalState.useShaders)
        {
            Rngon.internalState.shader_function({
                renderWidth: screenWidth,
                renderHeight: screenHeight,
                fragmentBuffer: Rngon.internalState.fragmentBuffer.data,
                pixelBuffer: Rngon.internalState.pixelBuffer.data,
                ngonCache: Rngon.internalState.ngonCache.ngons,
                cameraPosition: options.cameraPosition,
            });
        }

        copy_render_pixel_buffer();
    }
}
