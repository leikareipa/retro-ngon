/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {rasterizer} from "../default-pipeline/rasterizer.js"
import {transform_clip_lighter} from "../default-pipeline/transform-clip-lighter.js"
import {surface_wiper} from "../default-pipeline/surface-wiper.js"
import {surface as Surface} from "../core/surface.js";
import {assert as Assert} from "../core/util.js";
import {mesh as Mesh} from "./mesh.js";
import {vector as Vector} from "./vector.js";
import {state as State} from "../core/internal-state.js";

export function render({
    target = null,
    scene = [Mesh()],
    options = {},
    pipeline = {},
} = {})
{
    const renderCallInfo = {
        renderWidth: 0,
        renderHeight: 0,
        numNgonsRendered: 0,
        totalRenderTimeMs: performance.now(),
    };

    options = Object.freeze({
        ...render.defaultOptions,
        ...options
    });

    pipeline = Object.freeze({
        ...render.defaultPipeline,
        ...pipeline
    });

    const state = setup_render_state(options, pipeline);

    // The canvas element can be passed in in a couple of ways, e.g. as a string that
    // identifies the DOM element, or directly as a DOM element object. So let's figure
    // out what we received, and turn it into a DOM element object for the renderer
    // to operate on.
    if (typeof target === "string")
    {
        target = document.getElementById(target);
    }

    Assert?.(
        ((target === null) ||
         (target instanceof HTMLCanvasElement)),
        "Invalid canvas element for rendering into."
    );

    Assert?.(
        (!state.usePalette || (target instanceof HTMLPalettedCanvasElement)),
        "For paletted rendering, the attribute is='paletted-canvas' must be present on the target <canvas>."
    );
    
    // Render a single frame.
    {
        const surface = Surface(target, state);

        renderCallInfo.renderWidth = surface.width;
        renderCallInfo.renderHeight = surface.height;

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (surface && (!options.hibernateWhenTargetNotVisible || surface.is_in_view()))
        {
            surface.display_meshes(scene);
            renderCallInfo.numNgonsRendered = state.ngonCache.count;
        }
    }

    renderCallInfo.totalRenderTimeMs = (performance.now() - renderCallInfo.totalRenderTimeMs);

    return renderCallInfo;
};

render.defaultOptions = {
    cameraPosition: Vector(0, 0, 0),
    cameraDirection: Vector(0, 0, 0),
    state: "default",
    resolution: 1,
    fov: 43,
    nearPlane: 1,
    farPlane: 1000,
    useDepthBuffer: true,
    useFragmentBuffer: false,
    usePerspectiveInterpolation: true,
    globalWireframe: false,
    hibernateWhenTargetNotVisible: true,
    lights: [],
    palette: null,
};

render.defaultPipeline = {
    surfaceWipe: undefined,
    rasterize: undefined,
    transformClipLighter: undefined,
    pixelShader: null,
    vertexShader: null,
    contextShader: null,
    rasterShader: undefined,
}

function setup_render_state(options = {}, pipeline = {})
{
    const state = State(options.state);

    state.useDepthBuffer = Boolean(options.useDepthBuffer);
    state.showGlobalWireframe = Boolean(options.globalWireframe);
    state.lights = options.lights;

    state.renderScale = (
        (typeof options.resolution === "number")
            ? options.resolution
            : 1 // Will use options.width and options.height instead.
    );
    state.offscreenRenderWidth = options.resolution.width;
    state.offscreenRenderHeight = options.resolution.height;

    state.nearPlaneDistance = options.nearPlane;
    state.farPlaneDistance = options.farPlane;

    state.fov = options.fov;
    state.cameraDirection = options.cameraDirection;
    state.cameraPosition = options.cameraPosition;

    state.usePerspectiveInterpolation = Boolean(options.usePerspectiveInterpolation);

    state.useFragmentBuffer = Boolean(
        options.useFragmentBuffer ||
        // Detect whether the shader function's parameter list includes the fragment buffer.
        // Note that this doesn't always work, e.g. when the function has been .bind()ed.
        (state.usePixelShader && state.pixel_shader?.toString().match(/{(.+)?}/)[1].includes("fragmentBuffer"))
    );

    state.usePalette = Array.isArray(options.palette);
    state.palette = options.palette;

    state.modules.rasterize = (
        (typeof pipeline.rasterizer === "function")
            ? pipeline.rasterizer
            : (pipeline.rasterizer === null)
                ? null
                : rasterizer
    );

    state.modules.transform_clip_light = (
        (typeof pipeline.transformClipLighter === "function")
            ? pipeline.transformClipLighter
            : (pipeline.transformClipLighter === null)
                ? null
                : transform_clip_lighter
    );

    state.modules.surface_wipe = (
        (typeof pipeline.surfaceWiper === "function")
            ? pipeline.surfaceWiper
            : (pipeline.surfaceWiper === null)
                ? null
                : surface_wiper
    );

    state.usePixelShader = Boolean(pipeline.pixelShader);
    state.modules.pixel_shader = (
        (typeof pipeline.pixelShader === "function")
            ? pipeline.pixelShader
            : (pipeline.pixelShader === null)
                ? null
                : null /// TODO: Default pixel shader here.
    );

    state.useVertexShader = Boolean(pipeline.vertexShader);
    state.modules.vertex_shader = (
        (typeof pipeline.vertexShader === "function")
            ? pipeline.vertexShader
            : (pipeline.vertexShader === null)
                ? null
                : null /// TODO: Default vertex shader here.
    );

    state.useContextShader = Boolean(pipeline.contextShader);
    state.modules.context_shader = (
        (typeof pipeline.contextShader === "function")
            ? pipeline.contextShader
            : (pipeline.contextShader === null)
                ? null
                : null /// TODO: Default context shader here.
    );

    state.modules.raster_shader = (
        (typeof pipeline.rasterShader === "function")
            ? pipeline.rasterShader
            : undefined
    );

    return state;
}
