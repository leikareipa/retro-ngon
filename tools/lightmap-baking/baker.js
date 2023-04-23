/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import * as FileSaver from "./filesaver/FileSaver.js";
import {combined_shade_maps_sets,
        apply_shade_maps_to_ngons,
        load_shade_maps_from_file,
        save_shade_maps_to_file,
        bilinear_filter_shade_maps,
        duplicate_ngon_textures} from "./shademap-tools.js";

// An interface for lightmap baking. Returns a promise that resolves when the baking
// has completed. See the bake_lightmap.defaultOptions object for information about
// the options you can pass in.
export function bake_lightmap(
    ngons = [Rngon.ngon()],
    lights = [Rngon.light()],
    options = {}
)
{
    options = {
        ...bake_lightmap.defaultOptions,
        ...options,
    };

    console.log(`Preparing to bake to ${options.target}...`);

    return new Promise((resolve, reject)=>
    {
        // Vertex-baking only supports running in one thread.
        if (options.target == "vertices")
        {
            options.numWorkers = 1;
        }

        const workerScriptFilename = (()=>
        {
            switch (options.target)
            {
                case "vertices":
                {
                    return "bake-vertex-lightmap.js";
                }
                case "textures":
                {
                    return "bake-texture-lightmap.js";
                }
                default:
                {
                    reject("Received an unrecognized 'target' option.");
                    return;
                }
            }
        })();

        // We'll accumulate shading data from the worker threads in here.
        const shadeMaps = [];

        let loggingIntervalId;

        const workers = [];
        let numWorkersFinished = 0;
        options.numWorkers = Math.max(1, options.numWorkers);

        for (let i = 0; i < options.numWorkers; i++)
        {
            console.log(`Spawning baker thread ${i+1}/${options.numWorkers}...`);

            const worker = new Worker(`${options.scriptBasePath}/${workerScriptFilename}`);

            workers.push(worker);

            worker.onmessage = (message)=>
            {
                message = message.data;

                if (typeof message != "object")
                {
                    reject("Received an invalid message from a worker thread.");
                    return;
                }

                switch (message.type)
                {
                    case "finished":
                    {
                        worker.terminate();

                        shadeMaps.push(message.shadeMaps);

                        console.log(`Baker thread ${shadeMaps.length}/${options.numWorkers} finished`);

                        if (++numWorkersFinished == options.numWorkers)
                        {
                            (async()=>
                            {
                                await process_shade_maps(ngons, shadeMaps, options);

                                loggingIntervalId = clearInterval(loggingIntervalId);
                                console.log("Baking finished");

                                resolve();
                            })();

                            return;
                        }

                        break;
                    }
                    case "error":
                    {
                        // If any worker reports an error, we want to terminate all workers.
                        workers.forEach(w=>w.terminate());

                        // If we hadn't yet reported the the error to the user, do so.
                        if (loggingIntervalId)
                        {
                            loggingIntervalId = clearInterval(loggingIntervalId);
                            console.log(`Baking failed`);

                            reject(message.errorMessage);
                        }

                        return;
                    }
                    default:
                    {
                        reject("Received an unrecognized message from a worker thread.");
                        return;
                    }
                }
            };

            worker.postMessage({
                command: "start",
                ngons: ngons,
                lights: lights,
                options: options,
            });
        }

        // Indicate to the user how much time remains in the baking. Note that
        // if the baking target is "vertices", we expect the worker thread to
        // output its own info into the console.
        if (options.target != "vertices")
        {
            let startTime = performance.now();
            let prevTimeLabel = "";
            loggingIntervalId = setInterval(()=>
            {
                const msRemaining = ((options.numMinutesToBake * 60 * 1000) - (performance.now() - startTime));
                const sRemaining = Math.round(msRemaining / 1000);
                const mRemaining = Math.round(sRemaining / 60);
                const hRemaining = Math.round(mRemaining / 60);

                const timeLabel = (()=>
                {
                    if (sRemaining <= 0)
                    {
                        clearInterval(loggingIntervalId);
                        return "almost done";
                    }
                    if (sRemaining < 60) return `${sRemaining} sec`;
                    if (mRemaining < 60) return `${mRemaining} min`;
                    else return `${hRemaining} hr`;
                })();

                if (timeLabel != prevTimeLabel)
                {
                    console.log(`Baking to textures... ETA = ${timeLabel}`);
                    prevTimeLabel = timeLabel;
                }
            }, 1000);
        }
    });
}

bake_lightmap.defaultOptions = {
    target: "vertices",    // | "textures".
    numMinutesToBake: 1,   // For target{"textures"}. Longer bake time gives better-quality lighting.
    numWorkers: 1,         // In how many concurrent Web Workers to bake.
    epsilon: 0.00001,
    scriptBasePath: "",    // The base path for the lightmap baker's scripts, without the trailing slash.
    outputFile: null,
    inputFile: null,
    maxShadeMapWidth: Infinity,
    maxShadeMapHeight: Infinity,
};

// Applies the given shade maps to the given n-ngons' textures.
//
// If the shading target is "textures", the shade maps are expected in sets, where
// each set contains as many shade maps as there are n-gons. Each set may come e.g.
// from a worker thread.
//
// If the shading target is "vertices", the shade map array's elements are numerical
// shade values, one for each vertex in the given array of n-gons.
async function process_shade_maps(ngons = [Rngon.ngon()],
                                  shadeMaps = [],
                                  options = {})
{
    if (options.target == "textures")
    {
        // We have one shade map per n-gon, and we multiply the n-gon's texture by
        // the shade map, so each n-gon's texture must be unique.
        duplicate_ngon_textures(ngons);

        if (options.inputFile)
        {
            console.log("Integrating previous shading data...");
            shadeMaps.push(await load_shade_maps_from_file(
                options.inputFile,
                ngons,
                options.maxShadeMapWidth,
                options.maxShadeMapHeight)
            );
        }

        shadeMaps = combined_shade_maps_sets(shadeMaps, ngons);

        if (options.outputFile)
        {
            save_shade_maps_to_file(shadeMaps, options.outputFile);
        }

        apply_shade_maps_to_ngons(shadeMaps, ngons, "textures");
    }
    else if (options.target == "vertices")
    {
        apply_shade_maps_to_ngons(shadeMaps[0], ngons, "vertices");
    }

    return;
}
