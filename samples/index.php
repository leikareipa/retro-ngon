<!DOCTYPE html>
<html>
    <head>
        <title>Render samples - Retro n-gon renderer</title>
        <style>
            :root
            {
                --header-height: 47px;
            }
            body
            {
                background-color: rgb(228, 228, 228);
                color: black;
                overflow-y: hidden;
                margin: 0;
                padding: 0;
                height: 100vh;
                font-family: sans-serif;
            }

            #header
            {
                display: flex;
                box-sizing: border-box;
                position: relative;
                z-index: 1;
                width: 100%;
                height: var(--header-height);
                background-color: black;
                color: lightgray;
                box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
            }

            .selector-container
            {
                height: 100%;
                display: flex;
                align-items: center;
                background-color: lightgray;
                width: 50%;
            }

            .selector-container select
            {
                height: var(--header-height);
                border: none;
                background-color: white;
                color: black;
                border-radius: 0;
                padding: 6px;
                outline: none;
                flex-basis: 100%;
                font-family: sans-serif;
                font-size: 100%;
            }

            .selector-container .selector-tag
            {
                padding: 14px;
                background-color: transparent;
                border: none;
                color: black;
                white-space: nowrap;
                font-weight: bold;
            }

            #content
            {
                position: relative;
                z-index: 0;
                margin: 0;
                padding: 0;
                border: none;
                width: 100%;
                height: calc(100% - var(--header-height));
            }
        </style>
    </head>
    <body>
        <div id="header">
            <div id="sample-selector-container"
                 class="selector-container"
                 style="width: 75%;">
                <div class="selector-tag">Sample</div>
                <select id="sample-selector"
                        style="min-width: 150px;"
                        onchange="set_sample(event.target.value);">

                    <optgroup label="Features"></optgroup>
                    <option value="async-rendering">Async rendering</option>
                    <option value="builtin-shading">Built-in shading</option>
                    <option value="mipmapping">Mipmapping</option>
                    <option value="pixel-shaders">Pixel shaders</option>
                    <option value="rotating-triangle">Rotating triangle</option>
                    <option value="textured-cube-model">Textured cube model</option>
                    <option value="transparency">Transparency #1</option>
                    <option value="transparency-2">Transparency #2</option>
                    <option value="vertex-shaders">Vertex shaders</option>

                    <optgroup label="Ideas & Implementations"></optgroup>
                    <option value="first-person-camera">First person camera</option>
                    <option value="lightmaps">Lightmaps</option>
                    <option value="raytraced-lighting">Ray-traced lighting</option>
                    <option value="framerate-limiter">Refresh rate limiter</option>
                    <option value='oblique-2d-tiles'>Oblique 2D tile rendering</option>

                    <?php if (is_file("./extra-samples.php")) include("./extra-samples.php");?>

                </select>
            </div>
            <div id="renderer-selector-container"
                 class="selector-container">
                <div class="selector-tag">Renderer</div>
                <select id="renderer-selector"
                        style="min-width: 150px;"
                        onchange="set_version(event.target.value);">
                    <optgroup label="Supported"></optgroup>
                    <option value="dev">~dev</option>
                    <optgroup label="Deprecated"></optgroup>
                    <option value="beta.4">beta.4</option>
                    <option value="beta.3">beta.3</option>
                    <option value="beta.2">beta.2</option>
                    <option value="beta.1">beta.1</option>
                    <option value="alpha.8">alpha.8</option>
                    <option value="alpha.7">alpha.7</option>
                    <option value="alpha.6">alpha.6</option>
                    <option value="alpha.5">alpha.5</option>
                    <option value="alpha.4">alpha.4</option>
                </select>
            </div>
        </div>
        <iframe id="content"></iframe>
    </body>

    <script>
        const defaultSample = "<?php echo (is_file("./extra-samples.php")? "tomb-raider-home" : "textured-cube-model");?>";
        const defaultRenderer = "dev";

        const urlParams = new URLSearchParams(window.location.search);
        const sample = (urlParams.get("sample") || defaultSample);
        const renderer = (urlParams.get("renderer") || defaultRenderer);

        const rendererSelectorContainer = document.getElementById("renderer-selector-container");
        const sampleSelectorContainer = document.getElementById("sample-selector-container");
        const sampleSelector = document.getElementById("sample-selector");
        const rendererSelector = document.getElementById("renderer-selector");

        // The async rendering sample provides no way to set the renderer version.
        if (sample == "async-rendering")
        {
            rendererSelectorContainer.style.display = "none";
            sampleSelectorContainer.style.width = "100%";
        }

        if (!Array.from(sampleSelector.options).map(o=>o.value).includes(sample))
        {
            urlParams.set("sample", defaultSample);
            window.location.search = urlParams.toString();
        }
        else if (!Array.from(rendererSelector.options).map(o=>o.value).includes(renderer))
        {
            urlParams.set("renderer", defaultRenderer);
            window.location.search = urlParams.toString();
        }
        else
        {
            sampleSelector.value = sample;
            rendererSelector.value = renderer;
            document.getElementById("content").src = `./${sample}/?renderer=${renderer}`;
        }

        function set_version(newEngineName)
        {
            urlParams.set("renderer", newEngineName);
            window.location.search = urlParams.toString();
        }

        function set_sample(newTestName)
        {
            urlParams.set("sample", newTestName);
            window.location.search = urlParams.toString();
        }
    </script>
</html>
