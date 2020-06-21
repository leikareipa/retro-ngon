/*
 * 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// The id value of the DOM canvas we'll render the benchmark into.
const canvasId = "benchmark-canvas";

const renderWidth = 1280;
const renderHeight = 720;

export async function benchmark(sceneMeshes = [],
                                initialCameraPos = {x:0, y:0, z:0},
                                initialCameraDir = {x:0, y:0, z:0},
                                extraRenderOptions = {})
{
    create_dom_elements();

    const results = await run_bencmark(sceneMeshes, initialCameraPos, initialCameraDir, extraRenderOptions);

    print_results(results);

    return;
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
            // The percentage (in the range [0,1]) of the graph's width and height
            // that constitute the graph's margins, where no data is displayed.
            const graphMargin = 0.01;

            const timeMargin = ((event.target.clientWidth) * graphMargin);
            const fpsMargin = ((event.target.clientHeight) * graphMargin);

            const timeOffset = ((event.offsetX - timeMargin) / (event.target.clientWidth * (1 - (graphMargin * 2))));
            const fpsOffset = ((event.offsetY - fpsMargin) / (event.target.clientHeight * (1 - (graphMargin * 2))));

            const hoverFPS = (minimumFPS + (maximumFPS - minimumFPS) * fpsOffset);
            const hoverTimeMs = ((results[results.length-1].time - results[0].time) * timeOffset);

            {
                const infoLabel = document.getElementById("benchmark-graph-info-label");

                infoLabel.style.left = `${event.offsetX}px`;
                infoLabel.style.bottom = `${event.offsetY}px`;
                infoLabel.innerHTML = `${Math.floor(hoverFPS)} FPS; ${Math.floor(hoverTimeMs)} ms`;
            }
        }

        graphContainer.style.cssText = `
            display: inline-block;
            width: ${renderWidth}px;
            height: ${renderHeight}px;
            transform: scaleY(-1);
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            cursor: crosshair;
        `;
    }

    const graph = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    {
        graph.setAttribute("id", "benchmark-graph");
        graph.setAttribute("viewBox", `-1 -1 102 102`);
        graph.setAttribute("preserveAspectRatio", "none");
        graph.setAttribute("mouseover", "");

        graph.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 20px;
            pointer-events: none;
        `;
    }

    // Populate the graph.
    {
        graph.innerHTML = "";

        // Add a background grid.
        {
            const verticalIncrement = ((maximumFPS - minimumFPS) * 0.2);
            let gridValue = verticalIncrement;

            while (maximumFPS / gridValue > 1)
            {
                const markerPosition  = (((gridValue - minimumFPS) / (maximumFPS - minimumFPS)) * 100);

                graph.innerHTML += `
                    <line x1="0"
                          y1=${markerPosition}
                          x2="100"
                          y2=${markerPosition}
                          stroke-dasharray="4"
                          stroke-width="2"
                          stroke="dimgray"
                          vector-effect="non-scaling-stroke"/>
                `;

                gridValue += verticalIncrement;
            }
        }

        // Add the benchmark results.
        add_to_graph("renderFPS", "lightgray", minimumFPS, maximumFPS);
        add_to_graph("screenFPS", "navajowhite", minimumFPS, maximumFPS);
    }

    document.getElementById("benchmark-progress-bar").textContent = `Benchmarking finished. Average performance: ${averageFPS} FPS.`;
    graphContainer.appendChild(graph);
    document.getElementById("benchmark-container").insertBefore(graphContainer, document.getElementById("benchmark-progress-bar"));
    document.getElementById("benchmark-canvas").remove();

    function add_to_graph(resultProperty, color, minimum, maximum)
    {
        const startTime = results[0].time;
        const endTime = results[results.length-1].time;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        line.setAttribute("vector-effect", "non-scaling-stroke");
        line.setAttribute("stroke-width", "5");
        line.setAttribute("stroke", `${color}`);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke-linejoin", "round");
        line.setAttribute("stroke-linecap", "round");

        let points = "";

        for (let i = 0; i < results.length; i++)
        {
            const percentTime = (((results[i].time - startTime) / (endTime - startTime)) * 100);
            const percentFPS = Math.max(0, (((results[i][resultProperty] - minimum) / (maximum - minimum)) * 100));

            points += `${percentTime},${percentFPS} `;
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
function run_bencmark(sceneMeshes = [],
                      initialCameraPos = {x:0, y:0, z:0},
                      initialCameraDir = {x:0, y:0, z:0},
                      extraRenderOptions = {})
{
    return new Promise(resolve=>
    {
        const fpsReadings = [];
        const cameraDirection = Rngon.vector3(initialCameraDir.x, initialCameraDir.y, initialCameraDir.z);
        const cameraPosition = Rngon.translation_vector(initialCameraPos.x, initialCameraPos.y, initialCameraPos.z);

        // 'timeDeltaMs' is the number of milliseconds elapsed since the previous call
        // to this render function.
        (function render_loop(timestamp = 0, timeDeltaMs = 0, frameCount = 0)
        {
            const queue_new_frame = ()=>
            {
                window.requestAnimationFrame((newTimestamp)=>
                {
                    render_loop(newTimestamp, (newTimestamp - timestamp), (frameCount + 1));
                });
            };

            if (Math.abs(timeDeltaMs - timestamp) <= 0.0001)
            {
                if (frameCount > 10)
                {
                    Rngon.throw("Something went wrong while trying to initialize the renderer.");
                    return;
                }

                queue_new_frame();
                return;
            }

            // Rotate the camera 360 degrees in small increments per frame, then exit
            // the benchmark when done.
            if ((cameraDirection.y - initialCameraDir.y) < 360)
            {
                const percentDone = Math.floor(((cameraDirection.y - initialCameraDir.y) / 360) * 100);

                document.getElementById("benchmark-progress-bar").style.width = `${percentDone}%`;
                
                if (percentDone && ((percentDone % 10) == 0))
                {
                    document.getElementById("benchmark-progress-bar").style.opacity = "1";
                    document.getElementById("benchmark-progress-bar").textContent = `${percentDone}%`;
                }

                cameraDirection.y += (0.02 * timeDeltaMs);
            }
            else
            {
                document.getElementById("benchmark-progress-bar").style.width = "100%";
                document.getElementById("benchmark-progress-bar").style.transition = "none";

                resolve(fpsReadings);
                return;
            }

            const renderInfo = Rngon.render(canvasId, sceneMeshes,
            {
                clipToViewport: true,
                depthSort: "painter-reverse",
                useDepthBuffer: true,
                perspectiveCorrectInterpolation: true,
                cameraDirection: Rngon.rotation_vector(cameraDirection.x, cameraDirection.y, cameraDirection.z),
                cameraPosition: cameraPosition,
                ...extraRenderOptions,
            });

            fpsReadings.push({
                time: performance.now(),
                renderFPS: (1000 / renderInfo.totalRenderTimeMs),
                screenFPS: Math.round(1000 / (timeDeltaMs || Infinity)),
            });

            queue_new_frame();
            return;
        })();
    });
}

function create_dom_elements()
{
    // Create the main container.
    const mainContainer = document.createElement("div");
    {
        mainContainer.setAttribute("id", "benchmark-container");

        mainContainer.style.cssText = `
            width: ${renderWidth}px;
            background-color: transparent;
            display: flex;
            flex-direction: column;
            border: 0;
            position: relative;
            left: 50%;
            transform: translateX(-50%);
        `;

        document.body.appendChild(mainContainer);
    }

    // Create the canvas.
    const canvas = document.createElement("canvas");
    {
        canvas.setAttribute("id", canvasId);

        canvas.style.cssText = `
            width: 100%;
            height: ${renderHeight}px;
            background-color: black;
            padding: 0;
            margin: 0;
            border-radius: 20px;
            border: 1px solid black;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: -o-crisp-edges;
            image-rendering: -webkit-crisp-edges;
        `;

        mainContainer.appendChild(canvas);
    }

    // Create the progress bar.
    const progressBar = document.createElement("div");
    {
        progressBar.setAttribute("id", "benchmark-progress-bar");

        progressBar.style.cssText = `
            width: 0%;
            height: 0px;
            box-sizing: border-box;
            background-color: transparent;
            color: lightgray;
            text-align: right;
            line-height: 0;
            font-size: 95%;
            padding: 0;
            margin-top: 10px;
            margin-bottom: 10px;
            border-radius: 20px;
            border: 25px solid rgb(95, 95, 95);
            opacity: 0;
            transition: width .2s linear, opacity .75s linear;
        `;

        mainContainer.appendChild(progressBar);
    }

    // Create an informational label that will hover next to the cursor when the cursor
    // is over the graph.
    const infoLabel = document.createElement("div");
    {
        infoLabel.setAttribute("id", "benchmark-graph-info-label");

        infoLabel.style.cssText = `
            background-color: white;
            color: black;
            position: absolute;
            z-index: 10;
            left: 0:
            top: 0;
            text-align: left;
            padding: 9px;
            border-radius: 3px;
            box-shadow: 0 6px 2px -4px rgba(0, 0, 0, 0.2);
            pointer-events: none;
            user-select: none;
            white-space: nowrap;
            display: none;
        `;

        mainContainer.appendChild(infoLabel);
    }

    document.body.style.cssText = `
        text-align: center;
        background-color: gray;
        color: white;
        padding: 0;
        margin: 20px;
        font-family: sans-serif;
    `;

    return;
}

function remove_canvas()
{
    document.getElementById(canvasId).remove();

    return;
}
