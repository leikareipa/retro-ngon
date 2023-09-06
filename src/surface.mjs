/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Assert} from "./assert.mjs";
import {
    Matrix,
    matrix_multiply,
    matrix_perspective,
    matrix_ortho
} from "./api/matrix.mjs";
import {Ngon} from "./api/ngon.mjs";
import {Vertex} from "./api/vertex.mjs";
import {Vector} from "./api/vector.mjs";

// A surface for rendering onto. Will also paint the rendered image onto a HTML5 <canvas>
// element unless the 'canvasElement' parameter is null, in which case rendering will be
// to an off-screen buffer only.
//
// Returns null if the surface could not be created.
export function Surface(canvasElement, renderState)
{
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
        } = (renderOffscreen? setup_offscreen(renderState) : setup_onscreen(renderState, canvasElement)));

        massage_state(renderState, renderContext, surfaceWidth, surfaceHeight);
    }
    catch (error)
    {
        console.error(error);
        return null;
    }

    const cameraMatrix = matrix_multiply(
        Matrix.rotation(
            renderState.cameraDirection.x,
            renderState.cameraDirection.y,
            renderState.cameraDirection.z
        ),
        Matrix.translation(
            -renderState.cameraPosition.x,
            -renderState.cameraPosition.y,
            -renderState.cameraPosition.z
        )
    );

    const perspectiveMatrix = matrix_perspective(
        (renderState.fov * (Math.PI / 180)),
        (surfaceWidth / surfaceHeight),
        renderState.nearPlaneDistance,
        renderState.farPlaneDistance
    );

    const screenSpaceMatrix = matrix_ortho(
        (surfaceWidth + 1),
        (surfaceHeight + 1)
    );

    const publicInterface = {
        width: surfaceWidth,
        height: surfaceHeight,

        // Rasterizes the given meshes' n-gons onto this surface. Following this call,
        // the rasterized pixels will be in renderState.pixelBuffer, and the meshes'
        // screen-space n-gons in renderState.screenSpaceNgons. If a <canvas> element
        // id was specified for this surface, the rasterized pixels will also be
        // painted onto that canvas.
        display_meshes: function(meshes = [])
        {
            renderState.modules.surface_wiper?.(renderState);

            if (meshes.length)
            {
                // Prepare the meshes' n-gons for rendering.
                {
                    prepare_vertex_cache(renderState, meshes);
                    prepare_ngon_cache(renderState, meshes);

                    if (renderState.modules.transform_clip_lighter)
                    {
                        for (const mesh of meshes)
                        {
                            renderState.modules.transform_clip_lighter({
                                renderState,
                                mesh,
                                cameraMatrix,
                                perspectiveMatrix,
                                screenSpaceMatrix,
                            });
                        };
                    }

                    renderState.modules.ngon_sorter?.(renderState);

                    mark_npot_textures(renderState.screenSpaceNgons);
                }

                renderState.modules.rasterizer?.(renderState);

                if (renderState.usePixelShader)
                {
                    renderState.modules.pixel_shader(renderState);
                }
            }

            if (!renderOffscreen)
            {
                if (renderState.useContextShader)
                {
                    renderState.modules.context_shader(renderContext, renderState.pixelBuffer);
                }
                else
                {
                    renderContext.putImageData(renderState.pixelBuffer, 0, 0);
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
    };

    return publicInterface;
}

// Initializes the target DOM <canvas> element for rendering into. Throws on errors.
function setup_onscreen(renderState, canvasElement)
{
    const renderContext = canvasElement?.getContext("2d");

    Assert?.(
        ((canvasElement instanceof Element) && renderContext),
        "Invalid canvas element."
    );

    // Size the canvas as per the requested render scale.
    const surfaceWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * renderState.renderScale);
    const surfaceHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * renderState.renderScale);
    Assert?.(
        ((surfaceWidth > 0) && (surfaceHeight > 0)),
        "Failed to query the dimensions of the target canvas."
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
// Throws on errors.
function setup_offscreen(renderState)
{
    return {
        surfaceWidth: renderState.offscreenRenderWidth,
        surfaceHeight: renderState.offscreenRenderHeight,
        renderContext: {
            createImageData: function(width, height)
            {
                return new ImageData(width, height);
            },
        },
    };
}

// Initializes the internal render buffers if they're not already in a suitable renderState.
function massage_state(renderState, renderContext, surfaceWidth, surfaceHeight)
{
    if (
        (typeof renderState.pixelBuffer === "undefined") ||
        (renderState.pixelBuffer.width != surfaceWidth) ||
        (renderState.pixelBuffer.height != surfaceHeight)
    ){
        renderState.pixelBuffer = renderContext.createImageData(surfaceWidth, surfaceHeight);
        renderState.pixelBuffer8 = new Uint8ClampedArray(renderState.pixelBuffer.data.buffer);
        renderState.pixelBuffer32 = new Uint32Array(renderState.pixelBuffer.data.buffer);
    }

    if (
        renderState.useFragmentBuffer &&
        ((renderState.fragmentBuffer.width != surfaceWidth) ||
         (renderState.fragmentBuffer.height != surfaceHeight))
    ){
        renderState.fragmentBuffer.resize(surfaceWidth, surfaceHeight);
    }

    if (
        renderState.useDepthBuffer &&
        ((renderState.depthBuffer.width != surfaceWidth) ||
         (renderState.depthBuffer.height != surfaceHeight) ||
         !renderState.depthBuffer.data.length)
    ){
        renderState.depthBuffer.resize(surfaceWidth, surfaceHeight); 
    }

    return;
}

// Creates or resizes the vertex cache to fit at least the number of vertices contained
// in the given array of meshes.
function prepare_vertex_cache(renderState, meshes = [Ngon()])
{
    Assert?.(
        (meshes instanceof Array),
        "Invalid arguments to n-gon cache initialization."
    );

    const vertexCache = renderState.vertexCache;
    const vertexNormalCache = renderState.vertexNormalCache;
    let totalVertexCount = 0;

    for (const mesh of meshes)
    {
        for (const ngon of mesh.ngons)
        {
            totalVertexCount += ngon.vertices.length;
        }
    }

    if (!vertexCache ||
        !vertexCache.vertices.length ||
        (vertexCache.vertices.length < totalVertexCount))
    {
        const lengthDelta = (totalVertexCount - vertexCache.vertices.length);
        vertexCache.vertices.push(...new Array(lengthDelta).fill().map(e=>Vertex()));
    }
    vertexCache.count = 0;

    if (!vertexNormalCache ||
        !vertexNormalCache.normals.length ||
        (vertexNormalCache.normals.length < totalVertexCount))
    {
        const lengthDelta = (totalVertexCount - vertexNormalCache.normals.length);
        vertexNormalCache.normals.push(...new Array(lengthDelta).fill().map(e=>Vector()));
    }
    vertexNormalCache.count = 0;

    return;
}

// Creates or resizes the n-gon cache to fit at least the number of n-goans contained
// in the given array of meshes.
function prepare_ngon_cache(renderState, meshes = [Ngon()])
{
    Assert?.(
        (meshes instanceof Array),
        "Invalid arguments to n-gon cache initialization."
    );

    const ngonCache = renderState.ngonCache;
    const totalNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

    if (!ngonCache ||
        !ngonCache.ngons.length ||
        (ngonCache.ngons.length < totalNgonCount))
    {
        const lengthDelta = (totalNgonCount - ngonCache.ngons.length);
        ngonCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Ngon()));
    }

    ngonCache.count = 0;

    return;
}

// Marks any non-power-of-two affine-mapped faces in the given array of n-gons
// as using the non-power-of-two affine texture mapper. This needs to be done
// since the default affine mapper expects textures to be power-of-two.
function mark_npot_textures(ngons)
{
    for (const ngon of ngons)
    {
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

    return;
}