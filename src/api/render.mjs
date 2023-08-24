/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";
import {rasterizer} from "../default-pipeline/rasterizer.mjs";
import {transform_clip_lighter} from "../default-pipeline/transform-clip-lighter.mjs";
import {surface_wiper} from "../default-pipeline/surface-wiper.mjs";
import {Surface} from "../surface.mjs";
import {Assert} from "../assert.mjs";
import {Vector} from "./vector.mjs";
import {State} from "../api/state.mjs";

export const renderDefaultOptions = {
    cameraPosition: Vector(0, 0, 0),
    cameraDirection: Vector(0, 0, 0),
    state: "default",
    resolution: 1,
    fov: 43,
    nearPlane: 1,
    farPlane: 1000,
    useDepthBuffer: true,
    useFragmentBuffer: false,
    fragments: undefined,
    useFullInterpolation: true,
    globalWireframe: false,
    hibernateWhenTargetNotVisible: true,
    lights: [],
};

export const renderDefaultPipeline = {
    surfaceWiper: surface_wiper,
    rasterizer: rasterizer,
    transformClipLighter: transform_clip_lighter,
    pixelShader: undefined,
    vertexShader: undefined,
    contextShader: undefined,
};

const schema = {
    arguments: {
        where: "in arguments passed to render()",
        properties: {
            target: [
                "HTMLCanvasElement",
                "string",
                "null",
            ],
            scene: [["Mesh"]],
            options: ["object"],
            pipeline: ["object"],
        },
    },
    options: {
        where: "in render({options})",
        properties: { 
            cameraPosition: ["Vector"],
            cameraDirection: ["Vector"],
            state: ["string", "number"],
            resolution: ["number", "object"],
            fov: ["number"],
            nearPlane: ["number"],
            farPlane: ["number"],
            useDepthBuffer: ["boolean"],
            useFragmentBuffer: ["boolean"],
            fragments: ["object", "undefined"],
            useFullInterpolation: ["boolean"],
            globalWireframe: ["boolean"],
            hibernateWhenTargetNotVisible: ["boolean"],
            lights: [["Light", "object"]],
        },
    },
    pipeline: {
        where: "in render({pipeline})",
        properties: { 
            surfaceWiper: [
                "undefined",
                "null",
                "function"
            ],
            rasterizer: [
                "undefined",
                "null",
                "function"
            ],
            transformClipLighter: [
                "undefined",
                "null",
                "function"
            ],
            pixelShader: [
                "undefined",
                "function"
            ],
            vertexShader: [
                "undefined",
                "function"
            ],
            contextShader: [
                "undefined",
                "function"
            ],
        },
    },
};

export function render({
    target = null,
    scene,
    options = {},
    pipeline = {},
} = {})
{
    validate_object?.({target, scene, options, pipeline}, schema.arguments);

    const renderCallInfo = {
        renderWidth: 0,
        renderHeight: 0,
        numNgonsRendered: 0,
        totalRenderTimeMs: performance.now(),
    };

    options = Object.freeze({
        ...renderDefaultOptions,
        ...options
    });

    for (const key of Object.keys(renderDefaultPipeline))
    {
        if (typeof pipeline[key] === "undefined")
        {
            pipeline[key] = renderDefaultPipeline[key];
        }
    }

    validate_object?.(options, schema.options);
    validate_object?.(pipeline, schema.pipeline);

    if (target === null)
    {
        Assert?.(
            (typeof options.resolution === "object") &&
            (typeof options.resolution.width === "number") &&
            (typeof options.resolution.height === "number"),
            "Undefined render resolution. Off-screen rendering requires `options.resolution` to be an object of the form {width, height}."
        );
    }

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

    state.useFullInterpolation = Boolean(options.useFullInterpolation);

    state.useFragmentBuffer = Boolean(
        options.useFragmentBuffer ||
        // Detect whether the shader function's parameter list includes the fragment buffer.
        // Note that this doesn't always work, e.g. when the function has been .bind()ed.
        (state.usePixelShader && state.pixel_shader?.toString().match(/{(.+)?}/)[1].includes("fragmentBuffer"))
    );

    if (typeof options.fragments === "object")
    {
        for (const key of Object.keys(state.fragments))
        {
            state.fragments[key] = (options.fragments[key] ?? false);
        }
    }
    else
    {
        for (const key of Object.keys(state.fragments))
        {
            state.fragments[key] = state.useFragmentBuffer;
        }
    }

    state.modules.rasterizer = pipeline.rasterizer;
    state.modules.transform_clip_lighter = pipeline.transformClipLighter;
    state.modules.surface_wiper = pipeline.surfaceWiper;

    state.usePixelShader = Boolean(pipeline.pixelShader);
    state.modules.pixel_shader = pipeline.pixelShader;

    state.useVertexShader = Boolean(pipeline.vertexShader);
    state.modules.vertex_shader = pipeline.vertexShader;

    state.useContextShader = Boolean(pipeline.contextShader);
    state.modules.context_shader = pipeline.contextShader;

    return state;
}
