/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

Rngon.renderShared = {
    set_internal_render_state: function(options = {})
    {
        const state = Rngon.internalState;
        
        state.vertex_shader_function = options.vertexShaderFunction;
        state.useDepthBuffer = (options.useDepthBuffer == true);
        state.showGlobalWireframe = (options.globalWireframe == true);
        state.applyViewportClipping = (options.clipToViewport == true);
        state.lights = options.lights;
        state.farPlaneDistance = options.farPlane;
        state.useVertexShaders = (typeof options.vertexShaderFunction === "function");

        state.usePerspectiveCorrectInterpolation = ((options.perspectiveCorrectTexturing || // <- Name in pre-beta.2.
                                                     options.perspectiveCorrectInterpolation) == true);

        state.usePixelShaders = (typeof (options.shaderFunction || // <- Name in pre-beta.3.
                                         options.pixelShaderFunction) === "function");

        state.pixel_shader_function = (options.shaderFunction || // <- Name in pre-beta.3.
                                       options.pixelShaderFunction);

        return;
    },

    // Creates or resizes the n-gon cache (where we place transformed n-gons for rendering) to fit
    // at least the number of n-gons contained in the array of meshes we've been asked to render.
    prepare_ngon_cache: function(meshes = [])
    {
        Rngon.assert && (meshes instanceof Array)
                     || Rngon.throw("Invalid arguments to n-gon cache initialization.");

        const ngonCache = Rngon.internalState.ngonCache;
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
    },

    defaultRenderOptions:
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
        finishedCallback: null, // A function called by the renderer when rendering finishes. Only used by the async renderer.
    },
}
