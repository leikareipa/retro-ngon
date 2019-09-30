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
        performance:
        {
            // How long we took to perform certain actions. All values are in milliseconds.
            timingMs:
            {
                // How long we took to initialize the renderer.
                initialization: performance.now(),

                // How long we took to transform all the supplied n-gons into screen space.
                transformation: 0,

                // How long we took to rasterize the supplied n-gons onto the target canvas.
                rasterization: 0,

                // How much time this function took, in total.
                total: performance.now(),
            }
        }
    }

    // Confirm that the default render options are valid.
    Rngon.assert && (typeof Rngon.render.defaultOptions.cameraPosition !== "undefined" &&
                     typeof Rngon.render.defaultOptions.cameraDirection !== "undefined" &&
                     typeof Rngon.render.defaultOptions.scale !== "undefined" &&
                     typeof Rngon.render.defaultOptions.depthSort !== "undefined" &&
                     typeof Rngon.render.defaultOptions.hibernateWhenNotOnScreen !== "undefined" &&
                     typeof Rngon.render.defaultOptions.fov !== "undefined")
                 || Rngon.throw("The default options object for render() is missing required properties.");

    // Combine the default render options with the user-supplied ones.
    options = Object.freeze(
    {
        ...Rngon.render.defaultOptions,
        ...options
    });

    // Modify any internal render parameters based on the user's options.
    {
        Rngon.internalState.useDepthBuffer = (options.depthSort === "depthbuffer");
        Rngon.internalState.usePerspectiveCorrectTexturing = (options.perspectiveCorrectTexturing === true);
        Rngon.internalState.showGlobalWireframe = (options.globalWireframe === true);
        Rngon.internalState.applyViewportClipping = (options.clipToViewport === true);
    }

    const renderSurface = Rngon.screen(canvasElementId,
                                       Rngon.ngon_filler,
                                       Rngon.ngon_transformer,
                                       options.scale,
                                       options.fov,
                                       options.nearPlane,
                                       options.farPlane,
                                       options.pixelBuffer,
                                       options.auxiliaryBuffers);

    callMetadata.renderWidth = renderSurface.width;
    callMetadata.renderHeight = renderSurface.height;

    callMetadata.performance.timingMs.initialization = (performance.now() - callMetadata.performance.timingMs.initialization);

    // Render a single frame onto the render surface.
    if ((!options.hibernateWhenNotOnScreen || is_surface_in_view()))
    {
        renderSurface.wipe_clean();

        // Transform.
        callMetadata.performance.timingMs.transformation = performance.now();
        const transformedNgons = [];
        {
            const cameraMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.rotate(options.cameraDirection.x,
                                                                                          options.cameraDirection.y,
                                                                                          options.cameraDirection.z),
                                                                    Rngon.matrix44.translate(-options.cameraPosition.x,
                                                                                             -options.cameraPosition.y,
                                                                                             -options.cameraPosition.z));

            for (const mesh of meshes)
            {
                const meshNgons = mesh.ngons.reduce((array, ngon)=>{array.push(ngon.clone()); return array;}, []);
                renderSurface.transform_ngons(meshNgons, mesh.objectSpaceMatrix(), cameraMatrix);

                transformedNgons.push(...meshNgons);
            };

            // Apply depth sorting to the transformed ngons.
            switch (options.depthSort)
            {
                case "none":
                case "depthbuffer": break;

                // Painter's algorithm, i.e. sort by depth.
                case "painter":
                {
                    transformedNgons.sort((ngonA, ngonB)=>
                    {
                        const a = (ngonA.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonA.vertices.length);
                        const b = (ngonB.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonB.vertices.length);

                        return ((a === b)? 0 : ((a < b)? 1 : -1));
                    });

                    break;
                }
                
                default: Rngon.throw("Unknown depth sort option."); break;
            }
        }
        callMetadata.performance.timingMs.transformation = (performance.now() - callMetadata.performance.timingMs.transformation)

        // Rasterize.
        callMetadata.performance.timingMs.rasterization = performance.now();
        renderSurface.draw_ngons(transformedNgons);
        callMetadata.performance.timingMs.rasterization = (performance.now() - callMetadata.performance.timingMs.rasterization);

        callMetadata.performance.timingMs.total = (performance.now() - callMetadata.performance.timingMs.total);
        return callMetadata;
    }

    // Returns true if any horizontal part of the render surface DOM container is within the page's
    // visible region (accounting for the user having possibly scrolled the page up/down to cause
    // the container to have moved out of view).
    function is_surface_in_view()
    {
        const viewHeight = window.innerHeight;
        const containerRect = document.getElementById(canvasElementId).getBoundingClientRect();
        Rngon.assert && (containerRect != null) || Rngon.throw("Couldn't find the canvas container element.");

        return Boolean((containerRect.top > -containerRect.height) &&
                       (containerRect.top < viewHeight));
    }
};
Rngon.render.defaultOptions = 
{
    cameraPosition: Rngon.vector3(0, 0, 0),
    cameraDirection: Rngon.vector3(0, 0, 0),
    scale: 1,
    fov: 43,
    nearPlane: 1,
    farPlane: 1000,
    depthSort: "painter",
    clipToViewport: true,
    globalWireframe: false,
    hibernateWhenNotOnScreen: true,
    perspectiveCorrectTexturing: false,
    auxiliaryBuffers: [],
    pixelBuffer: {imageData: null},
};
