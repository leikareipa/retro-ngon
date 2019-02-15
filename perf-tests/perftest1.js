/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 * A rudimentary performance tester. Gets the job done, but not much else.
 * 
 * To run a test, call test() with a polygon you want rendered in the test scene. The test
 * will duplicate this polygon the given number of times, render it all on screen for
 * a period of time, and spit out an estimate of the FPS into a HTML table.
 * 
 * NOTE: The render loop relies on requestAnimationFrame() to spin it, so you want to make
 *       sure to keep the test running as the top-most tab in your browser. Otherwise, the
 *       function may not fire, and the test results will be skewed.
 *
 */

"use strict";

let numTimesRun = 0;
const rngon_perftest1 = function(title = "", polygon, numClones, maxNumClones, clone_count_increment = (polycount)=>(polycount*2))
{
    numTimesRun++;
    return new Promise((resolve)=>
    {
        test_loop(title, html(title), polygon, numClones, maxNumClones, clone_count_increment, ()=>(resolve()));
    });

    function test_loop(title = "", html = {}, polygon, numClones, maxNumClones,
                       clone_count_increment = (polycount)=>(polycount*2), resolve_promise = ()=>{})
    {
        if (numClones > maxNumClones)
        {
            html.containerElement.appendChild(document.createTextNode("'" + title + "' finished."));
            return resolve_promise();
        }

        const meshes = Array(numClones).fill(0)
                       .map((e, i)=>Rngon.mesh([polygon],
                                                Rngon.translation_vector(0, 0, 0),
                                                Rngon.rotation_vector(0, 0, 0)));

        for (let warmup = 0; warmup < 10; warmup++)
        {
            Rngon.render(html.canvasElement.getAttribute("id"), meshes,
                         Rngon.translation_vector(0, 0, 7),
                         Rngon.rotation_vector(0, 0, 0, 1));
        }

        // Print out the time it took to render the polygons, then run the test again
        // with more polys.
        const done = ()=>
        {
            const fps = Math.floor(numFrames * (1000 / (performance.now() - startTime)));
            const newTableEntry = document.createElement("tr");
            const newPolycount = document.createElement("td");
            const newFps = document.createElement("td");
            newPolycount.appendChild(document.createTextNode(numClones));
            newFps.appendChild(document.createTextNode(fps));
            newTableEntry.appendChild(newPolycount);
            newTableEntry.appendChild(newFps);
            html.resultsTableElement.appendChild(newTableEntry);

            test_loop(title, html, polygon, clone_count_increment(numClones), maxNumClones, clone_count_increment, resolve_promise);
        };

        // Loop at the screen's refresh rate (or slower, if we can't keep up) until the set
        // number of frames have been rendered.
        const numFrames = 180;
        const startTime = performance.now();
        (function render_loop(frameCount = 1)
        {
            Rngon.render(html.canvasElement.getAttribute("id"), meshes,
                        Rngon.translation_vector(0, 0, 7),
                        Rngon.rotation_vector(frameCount/50, 0, frameCount/100), 1);

            if (frameCount >= numFrames) done();
            else window.requestAnimationFrame(()=>render_loop(frameCount + 1));
        })();
    };

    // Generates the HTML elements to print the test's results into.
    function html(testTitle = "")
    {
        /*
            <canvas id="render-target" class="ngon-canvas"></canvas>
            <table id="results-table" style="margin: 0 auto; text-align: left; width: 150px;">
                <tr>
                    <th>Polycount</th>
                    <th>FPS</th>
                </tr>
            </table>
        */

        const containerElement = document.createElement("p");
        containerElement.style.cssText = "margin-bottom: 20px;";

        const canvasElement = document.createElement("canvas");
        canvasElement.setAttribute("id", "render-target-" + numTimesRun);
        canvasElement.style.cssText = "width: 320px; height: 200px; background-color: lightgray;";

        const resultsTableElement = document.createElement("table");
        resultsTableElement.setAttribute("id", "results-table-" + numTimesRun);
        resultsTableElement.style.cssText = "margin: 0 auto; text-align: left; width: 250px;";

        // Table header.
        {
            const titleRow = document.createElement("tr");
            const testNameCell = document.createElement("th");
            testNameCell.appendChild(document.createTextNode(testTitle));

            const headerRow = document.createElement("tr");
            const polycountCell = document.createElement("th");
            polycountCell.appendChild(document.createTextNode("Polycount"));
            const fpsCell = document.createElement("th");
            fpsCell.appendChild(document.createTextNode("FPS"));

            titleRow.appendChild(testNameCell);
            headerRow.appendChild(polycountCell);
            headerRow.appendChild(fpsCell);

            resultsTableElement.appendChild(titleRow);
            resultsTableElement.appendChild(headerRow);
        }

        containerElement.appendChild(canvasElement);
        containerElement.appendChild(resultsTableElement);
        document.body.insertBefore(containerElement, document.body.firstChild);

        if ([containerElement, canvasElement, resultsTableElement]
            .some((e)=>(e === null))) throw Error("Failed to create a valid HTML entry.");

        return Object.freeze(
        {
            containerElement,
            canvasElement,
            resultsTableElement
        });
    }
}
