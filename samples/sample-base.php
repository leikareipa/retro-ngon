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
            <i class="fas fa-wheelchair fa-fw spin"></i>
            Loading render sample...
        </div>

        <canvas id="canvas"
                class="rngon-canvas rngon-pixelated-upscale">
        </canvas>

        <div id="fps-display">
        </div>
        
        <script src="../distributable/rngon.cat.js"></script>
        <script>
            var renderSettings = {
                scale: 0.2,
                cameraDirection: Rngon.rotation_vector(0, 0, 0),
                cameraPosition: Rngon.translation_vector(0, 0, -170),
            };
        </script>
        <script type="module">
            import {sample_scene} from "<?php $sampleID = ($_GET["sample"] ?? "rotating-triangle"); echo "./{$sampleID}/{$sampleID}.js"; ?>";

            // Runs the renderer continuously, in sync with the device's refresh rate.
            (function render_loop(frameCount = 0)
            {
                const scene = sample_scene(frameCount);

                // Scenes load async (first textures, then ngons), so we assume
                // that once the scene's ngon array is non-empty, the scene is
                // close enough to having finished loading.
                if (scene.ngons.length && document.getElementById("loading-bar"))
                {
                    document.getElementById("loading-bar").remove();
                }

                const renderInfo = Rngon.render("canvas", [scene],
                {
                    clipToViewport: true,
                    useDepthBuffer: true,
                    perspectiveCorrectTexturing: true,
                    cameraDirection: renderSettings.cameraDirection,
                    cameraPosition: renderSettings.cameraPosition,
                    scale: renderSettings.scale,
                });

                if (frameCount % 60 === 0)
                {
                    document.getElementById("fps-display").innerHTML = `FPS: ${Math.floor(1000 / (renderInfo.totalRenderTimeMs || 1))}`;
                }

                window.requestAnimationFrame(()=>render_loop(frameCount + 1));
            })();
        </script>
    </body>
</html>
