/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 * Renders a heightmapped voxel terrain directly into the pixel buffer.
 * 
 */

import {first_person_camera} from "../first-person-camera/camera.js";

let heightmap, colormap;

export const sample = {
    initialize: async function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:0, y:0, z:0},
            direction: {x:180, y:0, z:0},
            rotationSpeed: {x:4, y:0.75},
            allowMovement: false,
            allowRotation: true,
        });

        this.camera.fov = 70;
        this.camera.height = 140;

        heightmap = await Rngon.texture.load("../samples/ray-casting/heightmap.json");
        colormap = await Rngon.texture.load("../samples/ray-casting/colormap.json");
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        // Render the voxel terrain.
        const pixelBuf = Rngon.state.default.pixelBuffer;
        pixelBuf.data.fill(0);
        if (heightmap && colormap)
        {
            const screenWidth = pixelBuf.width;
            const screenHeight = pixelBuf.height;
            const angleIncrement = deg2rad(this.camera.fov / screenWidth);
            let viewAngle = deg2rad(this.camera.direction.y - (this.camera.fov / 2));
            let viewAngleRelative = deg2rad(-(this.camera.fov / 2));

            for (let x = 0; x < screenWidth; x++)
            {
                const xStep = Math.cos(viewAngle);
                const yStep = Math.sin(viewAngle);
                let xPos = this.camera.position.x;
                let yPos = this.camera.position.y;
                let highestVoxel = 0;

                for (let distance = 0; distance < 500; distance++)
                {
                    const fishDistance = ((distance * Math.cos(viewAngleRelative)) || 1);

                    xPos += xStep;
                    yPos += yStep;

                    // Wrap the ray around the heightmap at the borders.
                    if (xPos <= 0) xPos = (heightmap.width - 1);
                    else if (xPos > (heightmap.width - 1)) xPos = 1;
                    if (yPos <= 0) yPos = (heightmap.height - 1);
                    else if (yPos > (heightmap.height - 1)) yPos = 1;

                    const heightmapValue = heightmap.pixels[(~~xPos + ~~yPos * heightmap.width) * 4];
                    const projectedHeight = Math.min(screenHeight, ((heightmapValue - this.camera.height) * (255 / fishDistance) + this.camera.direction.x));

                    if (projectedHeight > highestVoxel)
                    {
                        let idx = ((x + (screenHeight - ~~highestVoxel - 1) * screenWidth) * 4);
                        for (let ySpan = ~~highestVoxel; ySpan < ~~projectedHeight; ySpan++)
                        {
                            pixelBuf.data[idx+0] = colormap.pixels[(~~xPos + ~~yPos * colormap.width) * 4 + 0];
                            pixelBuf.data[idx+1] = colormap.pixels[(~~xPos + ~~yPos * colormap.width) * 4 + 1];
                            pixelBuf.data[idx+2] = colormap.pixels[(~~xPos + ~~yPos * colormap.width) * 4 + 2];
                            pixelBuf.data[idx+3] = 255;
                            idx -= (screenWidth * 4);
                        }

                        highestVoxel = projectedHeight;
                    }

                    if (projectedHeight >= screenHeight)
                    {
                        break;
                    }
                }

                // Draw the sky.
                let idx = ((x + (screenHeight - ~~highestVoxel - 1) * screenWidth) * 4);
                for (let ySpan = ~~highestVoxel; ySpan < screenHeight; ySpan++)
                {
                    pixelBuf.data[idx+0] = 50;
                    pixelBuf.data[idx+1] = 140;
                    pixelBuf.data[idx+2] = 180;
                    pixelBuf.data[idx+3] = 255;
                    idx -= (screenWidth * 4);
                }

                viewAngle += angleIncrement;
                viewAngleRelative += angleIncrement;
            }
        }
    
        return {
            mesh: Rngon.mesh(),
            renderPipeline: {
                surfaceWiper: ()=>{},
                transformClipLighter: ()=>{},
                rasterizer: ()=>{},
            },
        };
    },
    numTicks: 0,
    camera: undefined,
};

function deg2rad(deg)
{
    return (deg * (Math.PI / 180));
}
