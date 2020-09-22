/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

// An interface for lightmap baking. Returns a promise that resolves when the baking
// has completed. See the bake_lightmap.defaultOptions object for information about
// the options you can pass in.
export function bake_lightmap(ngons = [Rngon.ngon()],
                              lights = [Rngon.light()],
                              options = {})
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
                    return options.softShadows
                           ? "bake-soft-texture-lightmap.js"
                           : "bake-hard-texture-lightmap.js";
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
                            apply_shade_maps(ngons, shadeMaps, options.target);

                            loggingIntervalId = clearInterval(loggingIntervalId);
                            console.log("Baking finished");

                            resolve();
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
    softShadows: true,     // For target{"textures"}. Soft shadows take longer to converge.
    numMinutesToBake: 1,   // For target{"textures"}. Longer bake time gives better-quality lighting.
    numWorkers: 1,         // In how many concurrent Web Workers to bake.
    epsilon: 0.00001,
    scriptBasePath: "",    // The base path for the lightmap baker's scripts, without the trailing slash.
};

// Applies the given shade maps to the given n-ngons' textures.
//
// If the shading target is "textures", the shade maps are expected in sets, where
// each set contains as many shade maps as there are n-gons. Each set may come e.g.
// from a worker thread.
//
// If the shading target is "vertices", the shade map array's elements are numerical
// shade values, one for each vertex in the given array of n-gons.
function apply_shade_maps(ngons = [Rngon.ngon()],
                          shadeMaps = [],
                          shadingTarget = "")
{
    if (shadingTarget == "textures")
    {
        // We have one shade map per n-gon, and we multiply the n-gon's texture by
        // the shade map, so each n-gon's texture must be unique.
        duplicate_ngon_textures(ngons);

        for (const [ngonIdx, ngon] of ngons.entries())
        {
            const texture = ngon.material.texture;

            for (let pixelIdx = 0; pixelIdx < (texture.width * texture.height); pixelIdx++)
            {
                const accumulatedLight = shadeMaps.reduce((acc, set)=>(acc + set[ngonIdx][pixelIdx].accumulatedLight), 0);
                const numSamples = shadeMaps.reduce((acc, set)=>(acc + set[ngonIdx][pixelIdx].numSamples), 0);
                const texel = texture.pixels[pixelIdx];

                const shade = Math.max(0,
                                       (accumulatedLight / (numSamples || 1)));

                texel.red   = Math.max(0, Math.min(texel.red,   (texel.red   * shade)));
                texel.green = Math.max(0, Math.min(texel.green, (texel.green * shade)));
                texel.blue  = Math.max(0, Math.min(texel.blue,  (texel.blue  * shade)));
            }
        }
    }
    else if (shadingTarget == "vertices")
    {
        const shadeMap = shadeMaps[0];
        let shadeIdx = 0;

        for (const ngon of ngons)
        {
            for (const vertex of ngon.vertices)
            {
                vertex.shade = shadeMap[shadeIdx++];
            }
        }
    }

    return;
}

// Creates a deep copy of each n-gon's texture. Untextured n-gons are assigned a deep
// copy of a blank texture whose color matches the polygon's material color.
function duplicate_ngon_textures(ngons = [Rngon.ngon()])
{
    for (const ngon of ngons)
    {
        const texture = (ngon.material.texture || {width:64, height:64});
        const copiedPixels = new Array(texture.width * texture.height * 4);

        for (let t = 0; t < (texture.width * texture.height); t++)
        {
            const texelColor = (texture.pixels? texture.pixels[t] : ngon.material.color);

            copiedPixels[t*4+0] = texelColor.red;
            copiedPixels[t*4+1] = texelColor.green;
            copiedPixels[t*4+2] = texelColor.blue;
            copiedPixels[t*4+3] = texelColor.alpha;
        }

        const newTexture = Rngon.texture_rgba({
            width: texture.width,
            height: texture.height,
            pixels: copiedPixels,
            needsFlip: false,
        });
        
        ngon.material.texture = newTexture;

        // The renderer maps power-of-two and non-power-of-two affine texture
        // coordinates differently, and assumes that affine mapping is by default
        // applied only to power-of-two textures. So we should mark any non-power-
        // of-two affine textures as such.
        if (ngon.material.textureMapping === "affine")
        {
            let widthIsPOT = ((newTexture.width & (newTexture.width - 1)) === 0);
            let heightIsPOT = ((newTexture.height & (newTexture.height - 1)) === 0);

            if (newTexture.width === 0) widthIsPOT = false;
            if (newTexture.height === 0) heightIsPOT = false;

            if (!widthIsPOT || !heightIsPOT)
            {
                ngon.material.textureMapping = "affine-npot";
            }
        }
    }
    
    return;
}
