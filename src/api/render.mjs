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
import {ngon_sorter} from "../default-pipeline/ngon-sorter.mjs";
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
    ngonSorter: ngon_sorter,
    surfaceWiper: surface_wiper,
    rasterizer: rasterizer,
    transformClipLighter: transform_clip_lighter,
    pixelShader: undefined,
    vertexShader: undefined,
    contextShader: undefined,
    rasterPath: undefined,
};

const schema = {
    arguments: {
        where: "in arguments to Rngon::render()",
        properties: {
            target: [
                "HTMLCanvasElement",
                "string",
                "undefined",
            ],
            meshes: [["Mesh"]],
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
            ngonSorter: [
                "undefined",
                "function"
            ],
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
            rasterPath: [
                "undefined",
                "function"
            ],
        },
    },
};

export function render({
    target,
    meshes,
    options = {},
    pipeline = {},
} = {})
{
    validate_object?.({target, meshes, options, pipeline}, schema.arguments);

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

    if (target === undefined)
    {
        Assert?.(
            (typeof options.resolution === "object") &&
            (typeof options.resolution.width === "number") &&
            (typeof options.resolution.height === "number"),
            "No on-screen render target given. Off-screen rendering requires `options.resolution` to be an object of the form {width, height}."
        );
    }
    else if (typeof target === "string")
    {
        const originalId = target;
        target = document.getElementById(target);

        Assert?.(
            (target instanceof HTMLCanvasElement),

            `The render target <canvas id="${originalId}"> doesn't exist in the document.`
        );
    }
    else
    {
        Assert?.(
            (target instanceof HTMLCanvasElement),
            `The render target ${target} isn't an instance of HTMLCanvasElement.`
        );
    }

    const state = setup_render_state(options, pipeline);

    // Render a single frame.
    {
        const surface = Surface(target, state);
        state.resolution.width = renderCallInfo.renderWidth = surface.width;
        state.resolution.height = renderCallInfo.renderHeight = surface.height;

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (surface && (!options.hibernateWhenTargetNotVisible || surface.is_in_view()))
        {
            surface.display_meshes(meshes);
            renderCallInfo.numNgonsRendered = state.screenSpaceNgons.length;
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
            : undefined
    );
    state.renderWidth = options.resolution.width;
    state.renderHeight = options.resolution.height;

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

    state.pipeline.ngon_sorter = pipeline.ngonSorter;
    state.pipeline.rasterizer = pipeline.rasterizer;
    state.pipeline.transform_clip_lighter = pipeline.transformClipLighter;
    state.pipeline.surface_wiper = pipeline.surfaceWiper;

    state.usePixelShader = Boolean(pipeline.pixelShader);
    state.pipeline.pixel_shader = pipeline.pixelShader;

    state.useVertexShader = Boolean(pipeline.vertexShader);
    state.pipeline.vertex_shader = pipeline.vertexShader;

    state.useContextShader = Boolean(pipeline.contextShader);
    state.pipeline.context_shader = pipeline.contextShader;

    state.pipeline.raster_path = pipeline.rasterPath;

    return state;
}
