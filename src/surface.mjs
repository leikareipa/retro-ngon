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
import {validate_object} from "./schema.mjs";

const schema = {
    arguments: {
        where: "in arguments to Rngon::surface()",
        properties: {
            "canvasElement": ["HTMLCanvasElement"],
            "renderContext": ["Context"],
        },
    },
    interface: {
        where: "in the return value of Rngon::surface()",
        properties: {
            "$constructor": {
                value: "Surface",
            },
            "width": ["number"],
            "height": ["number"],
            "display_meshes": ["function"],
            "is_in_view": ["function"],
        },
    },
};

// A surface for rendering onto. Will also paint the rendered image onto a HTML5 <canvas>
// element unless the 'canvasElement' parameter is null, in which case rendering will be
// to an off-screen buffer only.
//
// Returns null if the surface could not be created.
export function Surface(canvasElement, renderContext)
{
    validate_object?.({canvasElement, renderContext}, schema.arguments);

    const renderOffscreen = (canvasElement === null);

    let surfaceWidth = undefined;
    let surfaceHeight = undefined;
    let canvasContext = undefined;

    try
    {
        ({
            surfaceWidth,
            surfaceHeight,
            canvasElement,
            canvasContext
        } = (renderOffscreen? setup_offscreen(renderContext) : setup_onscreen(renderContext, canvasElement)));

        massage_context(canvasContext, renderContext, surfaceWidth, surfaceHeight);
    }
    catch (error)
    {
        console.error(error);
        return null;
    }

    const cameraMatrix = matrix_multiply(
        Matrix.rotation(
            renderContext.cameraDirection.x,
            renderContext.cameraDirection.y,
            renderContext.cameraDirection.z
        ),
        Matrix.translation(
            -renderContext.cameraPosition.x,
            -renderContext.cameraPosition.y,
            -renderContext.cameraPosition.z
        )
    );

    const perspectiveMatrix = matrix_perspective(
        (renderContext.fov * (Math.PI / 180)),
        (surfaceWidth / surfaceHeight),
        renderContext.nearPlaneDistance,
        renderContext.farPlaneDistance
    );

    const screenSpaceMatrix = matrix_ortho(
        (surfaceWidth + 1),
        (surfaceHeight + 1)
    );

    const publicInterface = {
        $constructor: "Surface",
        
        width: surfaceWidth,
        height: surfaceHeight,

        // Rasterizes the given meshes' n-gons onto this surface. Following this call,
        // the rasterized pixels will be in renderContext.pixelBuffer, and the meshes'
        // screen-space n-gons in renderContext.screenSpaceNgons. If a <canvas> element
        // id was specified for this surface, the rasterized pixels will also be
        // painted onto that canvas.
        display_meshes: function(meshes = [])
        {
            renderContext.pipeline.surface_wiper?.(renderContext);

            if (meshes.length)
            {
                // Prepare the meshes' n-gons for rendering.
                {
                    prepare_vertex_cache(renderContext, meshes);
                    prepare_ngon_cache(renderContext, meshes);

                    if (renderContext.pipeline.transform_clip_lighter)
                    {
                        for (const mesh of meshes)
                        {
                            renderContext.pipeline.transform_clip_lighter({
                                renderContext,
                                mesh,
                                cameraMatrix,
                                perspectiveMatrix,
                                screenSpaceMatrix,
                            });
                        };
                    }

                    renderContext.pipeline.ngon_sorter?.(renderContext);

                    mark_npot_textures(renderContext.screenSpaceNgons);
                }

                renderContext.pipeline.rasterizer?.(renderContext);

                if (renderContext.usePixelShader)
                {
                    renderContext.pipeline.pixel_shader(renderContext);
                }
            }

            if (!renderOffscreen)
            {
                if (renderContext.useCanvasShader)
                {
                    renderContext.pipeline.canvas_shader(canvasContext, renderContext.pixelBuffer);
                }
                else
                {
                    canvasContext.putImageData(renderContext.pixelBuffer, 0, 0);
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

    validate_object?.(publicInterface, schema.interface);

    return publicInterface;
}

// Initializes the target DOM <canvas> element for rendering into. Throws on errors.
function setup_onscreen(renderContext, canvasElement)
{
    const canvasContext = canvasElement?.getContext("2d");

    Assert?.(
        ((canvasElement instanceof Element) && canvasContext),
        "Invalid canvas element"
    );

    let surfaceWidth = undefined;
    let surfaceHeight = undefined;

    if (typeof renderContext.renderScale === "number")
    {
        surfaceWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * renderContext.renderScale);
        surfaceHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * renderContext.renderScale);
        
        Assert?.(
            (surfaceWidth > 0) &&
            (surfaceHeight > 0),
            "Failed to query the dimensions of the target canvas"
        );
    }
    else
    {
        Assert?.(
            (typeof renderContext.renderWidth === "number") &&
            (typeof renderContext.renderHeight === "number"),
            "Invalid render resolution"
        );

        surfaceWidth = renderContext.renderWidth;
        surfaceHeight = renderContext.renderHeight;
    }
    
    canvasElement.setAttribute("width", surfaceWidth);
    canvasElement.setAttribute("height", surfaceHeight);

    return {
        surfaceWidth,
        surfaceHeight,
        canvasElement,
        canvasContext
    };
}

// Sets up rendering into an off-screen buffer, i.e. without using a DOM <canvas>
// element. Right now, since the renderer by default renders into an off-screen
// buffer first and then transfers the pixels onto a <canvas>, this function
// is more about just skipping initialization of the <canvas> element.
//
// Throws on errors.
function setup_offscreen(renderContext)
{
    return {
        surfaceWidth: renderContext.renderWidth,
        surfaceHeight: renderContext.renderHeight,
        canvasContext: {
            createImageData: function(width, height)
            {
                return new ImageData(width, height);
            },
        },
    };
}

// Initializes the internal render buffers if they're not already in a suitable renderContext.
function massage_context(canvasContext, renderContext, surfaceWidth, surfaceHeight)
{
    if (
        (typeof renderContext.pixelBuffer === "undefined") ||
        (renderContext.pixelBuffer.width != surfaceWidth) ||
        (renderContext.pixelBuffer.height != surfaceHeight)
    ){
        renderContext.pixelBuffer = canvasContext.createImageData(surfaceWidth, surfaceHeight);
        renderContext.pixelBuffer8 = new Uint8ClampedArray(renderContext.pixelBuffer.data.buffer);
        renderContext.pixelBuffer32 = new Uint32Array(renderContext.pixelBuffer.data.buffer);
    }

    if (
        renderContext.useFragmentBuffer &&
        ((renderContext.fragmentBuffer.width != surfaceWidth) ||
         (renderContext.fragmentBuffer.height != surfaceHeight))
    ){
        renderContext.fragmentBuffer.resize(surfaceWidth, surfaceHeight);
    }

    if (
        renderContext.useDepthBuffer &&
        ((renderContext.depthBuffer.width != surfaceWidth) ||
         (renderContext.depthBuffer.height != surfaceHeight) ||
         !renderContext.depthBuffer.data.length)
    ){
        renderContext.depthBuffer.resize(surfaceWidth, surfaceHeight); 
    }

    return;
}

// Creates or resizes the vertex cache to fit at least the number of vertices contained
// in the given array of meshes.
function prepare_vertex_cache(renderContext, meshes = [Ngon()])
{
    Assert?.(
        (meshes instanceof Array),
        "Invalid arguments to n-gon cache initialization."
    );

    const vertexCache = renderContext.vertexCache;
    const vertexNormalCache = renderContext.vertexNormalCache;
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
function prepare_ngon_cache(renderContext, meshes = [Ngon()])
{
    Assert?.(
        (meshes instanceof Array),
        "Invalid arguments to n-gon cache initialization."
    );

    const ngonCache = renderContext.ngonCache;
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