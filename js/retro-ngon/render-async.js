/*
 * 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

// Renders a single frame of the given meshes into an off-screen buffer (no
// dependency on the DOM, unlike Rngon.render() which renders into a <canvas>).
//
// The rendering is non-blocking and will be performed in a Worker thread.
//
// Returns a Promise that resolves with the following object:
//
//     {
//         image: <the rendered image as an ImageData object>,
//         renderWidth: <width of the rendered image>,
//         renderHeight: <height of the rendered image>,
//         totalRenderTimeMs: <number of milliseconds taken by the rendering>,
//     }
//
// On error, the Promise rejects with a string describing the error in plain language.
//
Rngon.render_async = function(meshes = [Rngon.mesh()],
                              options = {},
                              rngonUrl = null)
{
    return new Promise((resolve, reject)=>
    {
        // Spawn a new render worker with the render_worker() function as its body.
        const workerThread = new Worker(URL.createObjectURL(new Blob([`(${render_worker.toString()})()`],
        {
            type: 'text/javascript',
        })));

        // Listen for messages from the worker.
        workerThread.onmessage = (message)=>
        {
            message = message.data;

            if (typeof message.type !== "string")
            {
                reject("A render worker sent an invalid message.");

                return;
            }

            switch (message.type)
            {
                case "rendering-finished":
                {
                    // Remove properties that we don't need to report back.
                    delete message.type;

                    resolve(message);

                    break;
                } 
                case "error":
                {
                    resolve(`A render worker reported the following error: ${message.errorText}`);

                    break;
                } 
                default:
                {
                    reject("A render worker sent an unrecognized message.");
                    
                    break;
                }
            }
        }

        if (rngonUrl === null)
        {
            rngonUrl = Array.from(document.getElementsByTagName("script")).filter(e=>e.src.endsWith("rngon.cat.js"))[0].src;
        }

        // Tell the worker to render the given meshes.
        workerThread.postMessage({
            type: "render",
            meshes,
            options,
            rngonUrl,
        });
    });

    // The function we'll run as a Worker thread to perform the rendering.
    //
    // To ask this function to render an array of Rngon.mesh() objects into an off-screen
    // pixel buffer, post to it the following message, via postMessage():
    //
    //     {
    //         type: "render",
    //         meshes: [<your mesh array>],
    //         options: {<options to Rngon.render()},
    //         rngonUrl: `${window.location.origin}/distributable/rngon.cat.js`,
    //     }
    //
    // On successful completion of the rendering, the function will respond with the
    // following message, via postMessage():
    //
    //     {
    //         type: "rendering-finished",
    //         image: <the rendered image as an ImageData object>,
    //         renderWidth: <width of the rendered image>,
    //         renderHeight: <height of the rendered image>,
    //         totalRenderTimeMs: <number of milliseconds taken by the rendering>,
    //     }
    //
    // On error, the function will respond with the following message, via postMessage():
    //
    //     {
    //         type: "error",
    //         errorText: <a string describing the error in plain language>,
    //     }
    // 
    function render_worker()
    {
        onmessage = (message)=>
        {
            message = message.data;

            if (typeof message.type !== "string")
            {
                postMessage({
                    type: "error",
                    errorText: "A render worker received an invalid message.",
                });

                return;
            }

            switch (message.type)
            {
                // Render the meshes provided in the message, and in return postMessage() the
                // resulting pixel buffer.
                case "render":
                {
                    try
                    {
                        importScripts(message.rngonUrl);
                        render(message.meshes, message.options);
                    }
                    catch (error)
                    {
                        postMessage({
                            type: "error",
                            errorText: error.message,
                        });
                    }

                    break;
                }
                default:
                {
                    postMessage({
                        type: "error",
                        errorText: "Received an unrecognized message.",
                    });
                    
                    break;
                }
            }
        };

        // Renders the given meshes into the internal pixel buffer, Rngon.internalState.pixelBuffer.
        function render(meshes, renderOptions)
        {
            if (!Array.isArray(meshes))
            {
                Rngon.throw("Expected meshes to be provided in an array.");
                
                return;
            }

            const renderCallInfo = Rngon.renderShared.setup_render_call_info();

            const options = Object.freeze({
                ...Rngon.renderShared.defaultRenderOptions,
                ...renderOptions,
            });
            
            Rngon.renderShared.initialize_internal_render_state(options);

            // Disable the use of window.alert() while inside a Worker.
            Rngon.internalState.allowWindowAlert = false;
            
            // Render a single frame.
            {
                const renderSurface = Rngon.surface(null, options);
        
                if (renderSurface)
                {
                    renderSurface.display_meshes(meshes);

                    renderCallInfo.renderWidth = options.width;
                    renderCallInfo.renderHeight = options.height;
                    renderCallInfo.numNgonsRendered = Rngon.internalState.ngonCache.count;
                    renderCallInfo.image = Rngon.internalState.pixelBuffer;
                }
                else
                {
                    Rngon.throw("Failed to initialize the render surface.");

                    return;
                }
            }
        
            renderCallInfo.totalRenderTimeMs = (performance.now() - renderCallInfo.totalRenderTimeMs);

            postMessage({
                ...renderCallInfo,
                type: "rendering-finished",
            });

            return;
        }

        return;
    }
}
