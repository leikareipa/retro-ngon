/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Will create a HTML5 canvas element inside the given container, and render into it
// the given ngon meshes.
Rngon.render = function(canvasElementId,
                        meshes = [Rngon.mesh()],
                        options = {})
{
    // Initialize the object containing the data we'll return from this function.
    const callMetadata =
    {
        renderWidth: 0,
        renderHeight: 0,

        // The total count of n-gons rendered. May be smaller than the number of n-gons
        // originally submitted for rendering, due to visibility culling etc. performed
        // during the rendering process.
        numNgonsRendered: 0,

        // The total time this call to render() took, in milliseconds.
        totalRenderTimeMs: performance.now(),
    }

    // Combine the default render options with the user-supplied ones.
    options = Object.freeze({
        ...Rngon.render.defaultOptions,
        ...options
    });

    // Modify any internal render parameters based on the user's options.
    {
        Rngon.internalState.vertex_shader_function = options.vertexShaderFunction;
        Rngon.internalState.useDepthBuffer = (options.useDepthBuffer == true);
        Rngon.internalState.showGlobalWireframe = (options.globalWireframe == true);
        Rngon.internalState.applyViewportClipping = (options.clipToViewport == true);
        Rngon.internalState.lights = options.lights;
        Rngon.internalState.farPlaneDistance = options.farPlane;
        Rngon.internalState.useVertexShaders = (typeof options.vertexShaderFunction === "function");

        Rngon.internalState.usePerspectiveCorrectInterpolation = ((options.perspectiveCorrectTexturing || // <- Name in pre-beta.2.
                                                                   options.perspectiveCorrectInterpolation) == true);

        Rngon.internalState.usePixelShaders = (typeof (options.shaderFunction || // <- Name in pre-beta.3.
                                                       options.pixelShaderFunction) === "function");

        Rngon.internalState.pixel_shader_function = (options.shaderFunction || // <- Name in pre-beta.3.
                                                     options.pixelShaderFunction);
    }

    // Render a single frame into the target canvas.
    {
        const renderSurface = Rngon.canvas(canvasElementId,
                                           Rngon.ngon_filler,
                                           Rngon.ngon_transform_and_light,
                                           options);

        // We'll render either always or only when the render canvas is in view,
        // depending on whether the user asked us for the latter option.
        if (renderSurface &&
            (!options.hibernateWhenNotOnScreen || renderSurface.is_in_view()))
        {
            callMetadata.renderWidth = renderSurface.width;
            callMetadata.renderHeight = renderSurface.height;

            prepare_ngon_cache(Rngon.internalState.ngonCache, meshes);
            renderSurface.render_meshes(meshes);

            callMetadata.numNgonsRendered = Rngon.internalState.ngonCache.count;
        }
    }

    callMetadata.totalRenderTimeMs = (performance.now() - callMetadata.totalRenderTimeMs);

    return callMetadata;

    // Creates or resizes the n-gon cache (where we place transformed n-gons for rendering) to fit
    // at least the number of n-gons contained in the array of meshes we've been asked to render.
    function prepare_ngon_cache(ngonCache = {}, meshes = [])
    {
        Rngon.assert && ((typeof ngonCache === "object") &&
                         (meshes instanceof Array))
                     || Rngon.throw("Invalid arguments to n-gon cache initialization.");

        const sceneNgonCount = meshes.reduce((totalCount, mesh)=>(totalCount + mesh.ngons.length), 0);

        if (!ngonCache ||
            !ngonCache.ngons.length ||
            (ngonCache.ngons.length < sceneNgonCount))
        {
            const lengthDelta = (sceneNgonCount - ngonCache.ngons.length);

            ngonCache.ngons.push(...new Array(lengthDelta).fill().map(e=>Rngon.ngon()));
        }

        ngonCache.count = 0;

        return;
    }
};

Rngon.render.defaultOptions = 
{
    cameraPosition: Rngon.vector3(0, 0, 0),
    cameraDirection: Rngon.vector3(0, 0, 0),
    pixelShaderFunction: null, // If null, all pixel shader functionality will be disabled.
    vertexShaderFunction: null, // If null, all vertex shader functionality will be disabled.
    scale: 1,
    fov: 43,
    nearPlane: 1,
    farPlane: 1000,
    depthSort: "", // An empty string will make the renderer use its default depth sort option.
    useDepthBuffer: true,
    clipToViewport: true,
    globalWireframe: false,
    hibernateWhenNotOnScreen: true,
    perspectiveCorrectInterpolation: false,
    auxiliaryBuffers: [],
    lights: [],
};
