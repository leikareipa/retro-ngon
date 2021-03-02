<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" type="text/css" href="./sample-base.css">
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.1/css/all.css" integrity="sha384-gfdkjb5BdAXd+lj+gudLWI+BXq4IuLW5IT+brZEZsLFm++aCMlF1V92rMkPaX4PP" crossorigin="anonymous">
        <title>Sample template - Retro n-gon renderer</title>
    </head>
    <body>
        <div id="loading-bar">
            <i class="fas fa-skiing fa-fw spin"
               style="position: relative;
                      padding-bottom: 50px;
                      top: -25px;
                      left: -25px;
                      margin-right: 10px;"></i>
            Loading render sample...
        </div>

        <canvas id="canvas"
                class="rngon-canvas rngon-pixelated-upscale">
        </canvas>

        <div class="infoboxes-container">
            <div class="infobox scale">
                <div class="title">Scale</div>
                <div class="value">0.20</div>
                <div class="adjust left" onclick="change_scale(-1);"></div>
                <div class="adjust right" onclick="change_scale(1);"></div>
            </div>
            <div class="infobox polycount">
                <div class="title">Polys</div>
                <div class="value"><i class="fas fa-sm fa-spin fa-spinner"></i></div>
            </div>
            <div class="infobox fps"
                 title="Performance of Rngon.render()">
                <div class="title">FPS</div>
                <div class="value"><i class="fas fa-sm fa-spin fa-spinner"></i></div>
            </div>
            <div class="infobox refresh-rate"
                 title="Performance of Rngon.render()">
                <div class="title">Hz</div>
                <div class="value"><i class="fas fa-sm fa-spin fa-spinner"></i></div>
            </div>
        </div>
        
        <script src="<?php
                         $renderer = $_GET["renderer"];

                         if (!isset($renderer) ||
                             $renderer == "dev")
                         {
                             echo "../distributable/rngon.cat.js";
                         }
                         else
                         {
                            echo "../distributable/old/rngon.{$renderer}.cat.js";
                         }
                     ?>">
        </script>
        <script>
            // Transform the given render options to be backwards compatible with older
            // versions of the renderer (while maintaining support for the current version,
            // as well).
            function be_backwards_compatible(renderOptions = {})
            {
                // Pre-beta.2 didn't implement Rngon.light().
                if (!Rngon.light)
                {
                    Rngon.light = (position, settings)=>({position, ...settings});
                }

                // Pre-alpha.8 didn't implement a default case for the depth-sorting
                // mode and will throw if an unrecognized mode is used.
                if ((Rngon.version.family == "alpha") &&
                    (Rngon.version.major < 8))
                {
                    renderOptions.depthSort = "painter";
                }

                // Shader-related parameter names were changed in beta.5.
                {
                    // We want to take care to replace 'undefined' with 'null', since some
                    // versions of the renderer do a strict equality comparison for null
                    // (which would exclude undefined).
                    renderOptions.vertexShaderFunction = ((renderOptions.vertexShader == undefined)? null : renderOptions.vertexShader);
                    renderOptions.pixelShaderFunction = ((renderOptions.pixelShader == undefined)? null : renderOptions.pixelShader);
                }

                // The overridable modules object was introduced in beta.5.
                {
                    renderOptions.modules = (renderOptions.modules || {});

                    renderOptions.ngonRasterizerFunction = (renderOptions.modules.rasterize || renderOptions.modules.ngonFill);
                    renderOptions.ngonTransformClipLighterFunction = renderOptions.modules.transformClipLight;
                }
            }
        </script>
        <script>
            var renderSettings = {
                scale: 0.2,
                cameraDirection: Rngon.rotation_vector(0, 0, 0),
                cameraPosition: Rngon.translation_vector(0, 0, -170),
            };

            function change_scale(dir)
            {
                const scales = [0.05, 0.10, 0.15, 0.2, 0.3, 0.5, 0.75, 1];
                const newScaleIdx = Math.max(0, Math.min((scales.length - 1), (scales.indexOf(renderSettings.scale) + Math.sign(dir))));

                renderSettings.scale = (scales[newScaleIdx] || scales[0]);
                document.querySelector(".infobox.scale .value").innerHTML = renderSettings.scale.toFixed(2);
            }
        </script>
        <script>
            (async()=>
            {
                const canvasElement = "canvas"; // or "document.getElementById("canvas")" for versions >= beta.5.
                const sampleId = (new URLSearchParams(window.location.search).get("sample") || "textured-cube-model");
                const sampleModule = await import(`./${sampleId}/${sampleId}.js`);

                // The renderable assets will have finished loading when we reach this,
                // so it's safe to remove the loading indicator.
                document.getElementById("loading-bar").remove();

                // Used to keep track of when to update the UI's FPS and polycount displays
                // (and whatever other real-time-updated info the UI might be showing).
                let uiUpdateTimer = 0;

                // Runs the renderer continuously, in sync with the device's refresh rate.
                (function render_loop(timestamp = 0, frameTimeDeltaMs = 0, frameCount = 0)
                {
                    const queue_new_frame = (additionalTimeDelta = 0)=>
                    {
                        window.requestAnimationFrame((newTimestamp)=>
                        {
                            render_loop(newTimestamp,
                                        (additionalTimeDelta + (newTimestamp - timestamp)),
                                        (frameCount + 1));
                        });
                    };

                    // Attempt to limit the renderer's refresh rate, if so requested by the user.
                    if (sampleModule.sampleRenderOptions.targetRefreshRate &&
                        (frameTimeDeltaMs < Math.floor(1000 / sampleModule.sampleRenderOptions.targetRefreshRate)))
                    {
                        queue_new_frame(frameTimeDeltaMs);
                        return;
                    }
            
                    const scene = sampleModule.sample_scene(frameCount);
                    const options = {
                        clipToViewport: true,
                        depthSort: "painter-reverse",
                        useDepthBuffer: true,
                        perspectiveCorrectInterpolation: true,
                        cameraDirection: renderSettings.cameraDirection,
                        cameraPosition: renderSettings.cameraPosition,
                        scale: renderSettings.scale,
                        ...sampleModule.sampleRenderOptions,
                    };

                    be_backwards_compatible(options);

                    const renderInfo = Rngon.render(canvasElement, [scene], options);

                    if ((uiUpdateTimer += frameTimeDeltaMs) >= 500)
                    {
                        document.querySelector(".infobox.fps .value").innerHTML = Math.floor(1000 / (renderInfo.totalRenderTimeMs || 1));
                        document.querySelector(".infobox.polycount .value").innerHTML = renderInfo.numNgonsRendered;
                        document.querySelector(".infobox.refresh-rate .value").innerHTML = Math.floor(1000 / (frameTimeDeltaMs || 1));

                        uiUpdateTimer = 0;
                    }

                    queue_new_frame();
                })();
        })();
        </script>
    </body>
</html>
