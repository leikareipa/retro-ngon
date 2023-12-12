/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

import {first_person_camera} from "../first-person-camera/camera.js";

export const sample = {
    initialize: async function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:100, y:100, z:0},
            direction: {x:180, y:120, z:0},
            rotationSpeed: {x:4, y:0.75},
            allowMovement: false,
            allowRotation: true,
        });
        this.camera.fov = 70;
        this.camera.height = 130;

        this.heightmap = await Rngon.texture.load("../samples/ray-casting/heightmap.json");
        this.colormap = await Rngon.texture.load("../samples/ray-casting/colormap.json");
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        return {
            renderPipeline: {
                rasterizer: (renderContext)=>render_terrain(renderContext.pixelBuffer, this.heightmap, this.colormap, this.camera),
                transformClipLighter: null,
                surfaceWiper: null,
            },
        };
    },
    heightmap: undefined,
    colormap: undefined,
    numTicks: 0,
    camera: undefined,
};

// Renders a 2.5D heightmapped voxel terrain into the given pixel buffer.
function render_terrain(pixelBuffer, heightmap, colormap, camera)
{
    if (
        !heightmap ||
        !colormap ||
        (Number(heightmap.width) !== colormap.width) ||
        (Number(heightmap.height) !== colormap.height)
    ){
        return;
    }

    const renderWidth = pixelBuffer.width;
    const renderHeight = pixelBuffer.height;
    const angleIncrement = deg2rad(camera.fov / renderWidth);
    let viewAngle = deg2rad(camera.direction.y - (camera.fov / 2));
    let viewAngleRelative = deg2rad(-(camera.fov / 2));

    const levelsOfDetail = [
        {stepSkip: 1, endDistance: 300},
        {stepSkip: 70, endDistance: 10000},
    ];

    // For each vertical pixel span in the destination pixel buffer...
    for (let x = 0; x < renderWidth; x++)
    {
        const xStep = Math.cos(viewAngle);
        const yStep = Math.sin(viewAngle);
        let xPos = camera.position.x;
        let yPos = camera.position.y;
        let tallestVoxel = 0;
        let stepCount = 0;

        for (const lod of levelsOfDetail)
        {
            // ...trace a ray for at most this many steps along the heightmap. At each step,
            // if the height of the current voxel is greater than the highest voxel so far,
            // we'll draw it as a vertical column into the pixel buffer.
            for (; stepCount < lod.endDistance; stepCount += lod.stepSkip)
            {
                xPos += xStep;
                yPos += yStep;

                // Infinite wraparound at heightmap borders.
                if (xPos < 0) xPos = (heightmap.width - 1);
                else if (xPos >= heightmap.width) xPos = 0;
                if (yPos < 0) yPos = (heightmap.height - 1);
                else if (yPos >= heightmap.height) yPos = 0;

                const heightmapValue = heightmap.pixels[(~~xPos + ~~yPos * heightmap.width) * 4];
                const fishDistance = (stepCount * Math.cos(viewAngleRelative));
                const heightScalar = ((renderWidth / 4) / (fishDistance || 1));
                const voxelHeight = ~~Math.min(renderHeight, (((heightmapValue - camera.height) * heightScalar) + camera.direction.x));

                // Draw the voxel if it isn't occluded by the previous voxels.
                if (voxelHeight > tallestVoxel)
                {
                    let srcIdx = ((~~xPos + ~~yPos * colormap.width) * 4);
                    let dstIdx = ((x + (renderHeight - tallestVoxel - 1) * renderWidth) * 4);

                    for (let ySpan = tallestVoxel; ySpan < voxelHeight; ySpan++, dstIdx -= (renderWidth * 4))
                    {
                        pixelBuffer.data[dstIdx+0] = colormap.pixels[srcIdx+0];
                        pixelBuffer.data[dstIdx+1] = colormap.pixels[srcIdx+1];
                        pixelBuffer.data[dstIdx+2] = colormap.pixels[srcIdx+2];
                        pixelBuffer.data[dstIdx+3] = 255;
                    }

                    tallestVoxel = voxelHeight;
                }

                if (voxelHeight >= renderHeight)
                {
                    break;
                }
            }
        }

        // Draw the sky.
        {
            let dstIdx = ((x + (renderHeight - tallestVoxel - 1) * renderWidth) * 4);

            for (let ySpan = tallestVoxel; ySpan < renderHeight; ySpan++, dstIdx -= (renderWidth * 4))
            {
                pixelBuffer.data[dstIdx+0] = 50;
                pixelBuffer.data[dstIdx+1] = 140;
                pixelBuffer.data[dstIdx+2] = 180;
                pixelBuffer.data[dstIdx+3] = 255;
            }
        }

        viewAngle += angleIncrement;
        viewAngleRelative += angleIncrement;
    }
}

function deg2rad(deg)
{
    return (deg * (Math.PI / 180));
}
