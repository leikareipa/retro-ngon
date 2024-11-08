/*
 * 2020 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// The id value of the DOM canvas we'll render the benchmark into.
const canvasId = "benchmark-canvas";

window.benchResults = [];

let isHeadless = false;

export async function benchmark(
    sceneFileName = "",
    options = {
        renderOptions = {},
        renderPipeline = {},
        modelOptions = {},
    } = {},
)
{
    {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has("headless"))
        {
            isHeadless = true;
            options.renderOptions.resolution = {
                width: 640,
                height: 360,
            };
        }
        else
        {
            if (
                !urlParams.has("scale") ||
                isNaN(Number(urlParams.get("scale"))) ||
                (urlParams.get("scale") > 1) ||
                (urlParams.get("scale") < 0)
            )
            {
                urlParams.set("scale", 0.25);
                window.location.search = urlParams.toString();
            }
    
            options.renderOptions.resolution = Number(urlParams.get("scale"));
        }

    }
    
    create_dom_elements();
    const sceneMesh = await load_scene_mesh(sceneFileName, options.modelOptions);
    const results = await run_bencmark([sceneMesh], options.renderOptions, options.renderPipeline);
    print_results(results);

    return;
}

// Note: we expect the mesh file to export an object called 'benchmarkScene'
// whose property 'ngons' provides the scene's n-gons.
async function load_scene_mesh(filename, options = {})
{
    // Give the user a visual indication that we're loading data.
    const loadSpinner = document.createElement("div");
    loadSpinner.innerHTML = "Initializing...";
    loadSpinner.style.color = "lightgray";
    document.body.appendChild(loadSpinner);

    // Load the data.
    const sceneModule = await import(filename);
    await sceneModule.benchmarkScene.initialize(options);

    loadSpinner.remove();

    return Rngon.mesh(sceneModule.benchmarkScene.ngons);
}

function print_results(results)
{
    const [averageFPS, minimumFPS, maximumFPS] = (()=>
    {
        const renderFPS = results.map(r=>r.renderFPS);
        const renderFPSAverage = Math.round(renderFPS.reduce((total, fps)=>(total + fps)) / results.length);
        const renderFPSMinimum = Math.round(Math.min(...renderFPS));
        const renderFPSMaximum = Math.round(Math.max(...renderFPS));
    
        const screenFPS = results.map(r=>r.screenFPS);
        const screenFPSAverage = Math.round(screenFPS.reduce((total, fps)=>(total + fps)) / results.length);
        const screenFPSMinimum = Math.round(Math.min(...screenFPS));
        const screenFPSMaximum = Math.round(Math.max(...screenFPS));
    
        const averageFPS = (screenFPSAverage > renderFPSAverage)? screenFPSAverage : renderFPSAverage;
        const minimumFPS = (screenFPSMinimum > renderFPSMinimum)? screenFPSMinimum : renderFPSMinimum;
        const maximumFPS = (screenFPSMaximum > renderFPSMaximum)? screenFPSMaximum : renderFPSMaximum;

        return [averageFPS, minimumFPS, maximumFPS];
    })();

    const graphContainer = document.createElement("div");
    {
        graphContainer.setAttribute("id", "benchmark-graph-container");

        graphContainer.onmouseleave = (event)=>
        {
            document.getElementById("benchmark-graph-info-label").style.display = "none";
        }

        graphContainer.onmouseenter = (event)=>
        {
            document.getElementById("benchmark-graph-info-label").style.display = "initial";
            graphContainer.onmousemove(event);
        }

        graphContainer.onmousemove = (event)=>
        {
            // The percentage (in the range [0,1]) of the graph's width and height that constitute
            // the graph's margins (SVG viewBox), where no data is displayed.
            const graphMargin = 0.02;

            const timeMargin = ((event.target.clientWidth) * graphMargin);
            const fpsMargin = ((event.target.clientHeight) * graphMargin);

            const timeOffset = ((event.offsetX - timeMargin) / (event.target.clientWidth * (1 - (graphMargin * 2))));
            const fpsOffset = (((event.target.clientHeight - event.offsetY) - fpsMargin) / (event.target.clientHeight * (1 - (graphMargin * 2))));

            const hoverFPS = (minimumFPS + (maximumFPS - minimumFPS) * fpsOffset);
            const hoverTimeMs = Math.round((results.at(-1).timestamp - results[0].timestamp) * timeOffset);

            const infoLabel = document.getElementById("benchmark-graph-info-label");
            const infoLabelRect = infoLabel.getBoundingClientRect();

            const labelX = (event.clientX - infoLabelRect.width - 1);
            const labelY = (event.clientY - infoLabelRect.height - 1);

            infoLabel.style.left = `${Math.max(0, Math.min((window.innerWidth - infoLabelRect.width), labelX))}px`;
            infoLabel.style.top = `${Math.max(0, labelY)}px`;
            infoLabel.innerHTML = `<div class="secondary">${hoverTimeMs} ms</div><div class="primary">${Math.round(hoverFPS)}</div>`;
        }
    }

    const graph = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    {
        graph.setAttribute("id", "benchmark-graph");
        graph.setAttribute("viewBox", `-2 -2 104 104`);
        graph.setAttribute("preserveAspectRatio", "none");
        graph.setAttribute("mouseover", "");

        graph.innerHTML = "";
        add_to_graph({resultProperty: "renderFPS", lineColor: "#959595", lineWidth: 1});
        add_to_graph({resultProperty: "averageRenderFPS", lineColor: "aquamarine", lineWidth: 1});
    }

    const legendContainer = document.createElement("div");
    {
        legendContainer.setAttribute("class", "graph-legend");

        const didResolutionChange = results.some(r=>(
            (r.renderInfo.renderWidth != results.at(0).renderInfo.renderWidth) ||
            (r.renderInfo.renderHeight != results.at(0).renderInfo.renderHeight)
        ));

        const legendRes = document.createElement("div");
        legendRes.setAttribute("class", "item-meta resolution");
        legendRes.innerHTML = `Resolution: ${results.at(-1).renderInfo.renderWidth} &times; ${results.at(-1).renderInfo.renderHeight}${didResolutionChange? " (dynamic)" : ""}`;

        const legendCum = document.createElement("div");
        legendCum.setAttribute("class", "item cumulative");
        legendCum.textContent = "Average FPS";

        const legendRaw = document.createElement("div");
        legendRaw.setAttribute("class", "item raw");
        legendRaw.textContent = "Raw FPS";

        legendContainer.appendChild(legendRes);
        legendContainer.appendChild(legendCum);
        legendContainer.appendChild(legendRaw);
    }


    document.getElementById("benchmark-progress-bar").textContent = `Benchmark completed. Performance average: ${averageFPS} FPS.`;
    graphContainer.appendChild(graph);
    graphContainer.appendChild(legendContainer);
    document.getElementById("benchmark-container").insertBefore(graphContainer, document.getElementById("benchmark-progress-bar"));
    document.getElementById("benchmark-canvas").classList.add("finished");

    window.requestAnimationFrame(()=>graph.style.opacity = "1");

    function add_to_graph({resultProperty, lineColor, lineWidth})
    {
        const startTime = results[0].timestamp;
        const endTime = results[results.length-1].timestamp;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        line.setAttribute("vector-effect", "non-scaling-stroke");
        line.setAttribute("stroke-width", `${lineWidth}`);
        line.setAttribute("stroke", `${lineColor}`);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke-linejoin", "bevel");
        line.setAttribute("stroke-linecap", "bevel");

        let points = "";

        for (let i = 0; i < results.length; i++)
        {
            const percentTime = (((results[i].timestamp - startTime) / (endTime - startTime)) * 100);
            const percentFPS = (((results[i][resultProperty] - minimumFPS) / (maximumFPS - minimumFPS)) * 100);

            points += `${Math.max(0, Math.min(100, percentTime))},${Math.max(0, Math.min(100, percentFPS))} `;
        }

        line.setAttribute("points", points);
        graph.appendChild(line);
    }

    return;
}

// Renders as a performance benchmark a moving view of the given scene, and records the
// performance metrics of it.
//
// Returns a Promise that resolves with the benchmark results when the benchmark finishes.
// The results will be an array of objects like so:
//
// [
//     {time: <timestamp>, renderFPS: <frames per second>, screenFPS: <frames per second>},
//     {time: <timestamp>, renderFPS: <frames per second>, screenFPS: <frames per second>},
//     {time: <timestamp>, renderFPS: <frames per second>, screenFPS: <frames per second>},
//     ...
// ]
//
// The 'time' property gives a timestamp for when the accompanying render performance
// reading was taken. The 'renderFPS' property gives the performance of each call to
// render(); while 'screenFPS' gives the overall page refresh performance (which is
// limited to the screen's refresh rate).
//
function run_bencmark(sceneMeshes = [], renderOptions = {}, renderPipeline = {})
{
    return new Promise(resolve=>
    {
        const cameraDirection = structuredClone(renderOptions.cameraDirection);
        const cameraPosition = structuredClone(renderOptions.cameraPosition);

        // 'timeDeltaMs' is the number of milliseconds elapsed since the previous call
        // to this render function.
        (function render_loop(timestamp = performance.now(), timeDeltaMs = 0, frameCount = 0)
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

            // Update the UI.
            let percentDone = (((cameraDirection.y - renderOptions.cameraDirection.y) / 360) * 100);
            document.getElementById("benchmark-progress-bar").style.width = `${percentDone}%`;

            // Attempt to limit the renderer's refresh rate, if so requested by the user.
            if (renderOptions.targetRefreshRate &&
                (timeDeltaMs < Math.floor(1000 / renderOptions.targetRefreshRate)))
            {
                queue_new_frame(timeDeltaMs);
                return;
            }

            // Rotate the camera 360 degrees in small increments per frame, then exit
            // the benchmark when done.
            if ((cameraDirection.y - renderOptions.cameraDirection.y) < 360)
            {
                cameraDirection.y += (0.03 * timeDeltaMs);
            }
            else
            {
                document.getElementById("benchmark-progress-bar").style.display = "none";
                resolve(window.benchResults);
                return;
            }

            const renderInfo = Rngon.render({
                target: (isHeadless? undefined : canvasId),
                meshes: sceneMeshes,
                options: {
                    ...renderOptions,
                    cameraDirection: Rngon.vector(cameraDirection.x, cameraDirection.y, cameraDirection.z),
                    cameraPosition: cameraPosition,
                },
                pipeline: renderPipeline,
            });

            if (frameCount)
            {
                window.benchResults.push({
                    timestamp,
                    renderFPS: (1000 / renderInfo.totalRenderTimeMs),
                    screenFPS: (1000 / (timeDeltaMs || Infinity)),
                    renderInfo
                });

                window.benchResults.at(-1).averageRenderFPS = (window.benchResults.reduce((sum, f)=>(sum + f.renderFPS), 0) / (window.benchResults.length || 1));
                window.benchResults.at(-1).averageScreenFPS = (window.benchResults.reduce((sum, f)=>(sum + f.screenFPS), 0) / (window.benchResults.length || 1));
            }

            queue_new_frame();
            return;
        })();
    });
}

function create_dom_elements()
{
    const mainContainer = document.createElement("div");
    {
        mainContainer.setAttribute("id", "benchmark-container");
        document.body.appendChild(mainContainer);
    }

    const progressBar = document.createElement("div");
    {
        progressBar.setAttribute("id", "benchmark-progress-bar");
        mainContainer.appendChild(progressBar);
    }

    const canvas = document.createElement("canvas");
    {
        canvas.setAttribute("id", canvasId);
        mainContainer.appendChild(canvas);
    }

    const infoLabel = document.createElement("div");
    {
        infoLabel.setAttribute("id", "benchmark-graph-info-label");
        document.body.appendChild(infoLabel);
    }

    return;
}
