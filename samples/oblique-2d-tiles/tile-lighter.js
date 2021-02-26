/*
 * 2021 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 * Reimplements the retro n-gon renderer's n-gon lighting code to be more suitable
 * for lighting oblique 2D tiles.
 *
 */

"use strict";

const groundTileWidth = 22;
const groundTileHeight = 22;

export function tile_lighter(ngon)
{
    if (ngon.material.vertexShading !== "gouraud")
    {
        return;
    }

    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].shade = ngon.material.ambientLightLevel;
    }

    // Find the brightest shade falling on this n-gon's vertices.
    for (const light of Rngon.internalState.lights)
    {
        for (let v = 0; v < ngon.vertices.length; v++)
        {
            const vertex = ngon.vertices[v];
            let vX = vertex.x;
            let vY = vertex.y;

            // Rotate the vertex positions we'll use for calculating light rays.
            // We do this since the tile graphics are rotated 45 degrees but the
            // n-gons on which the graphics are displayed are squares interleaved
            // to create the seamless tiled look - so tiles surrounding a tile on
            // which a light source is placed would be brighter than the source
            // tile as their vertex corners are closer to the light source.
            //
            // We also modify the top (#0 and #3) vertices' Y values to create a
            // unit tile, i.e. a tile as tall as wide, so that lighting tall tiles
            // (e.g. walls) is uniform with how ground tiles (unit size) are lit.
            switch (v)
            {
                case 0: vY = (ngon.vertices[1].y - groundTileHeight); vX += 5; break;
                case 1: vY -= 5; break;
                case 2: vX -= 5; break;
                case 3: vY = (ngon.vertices[1].y - groundTileHeight); vY += 5; break;
            }

            const distance = Math.sqrt(((vX - light.position.x) * (vX - light.position.x)) +
                                       ((vY - light.position.y) * (vY - light.position.y)));

            const distanceMul = (1 / (1 + (light.attenuation * distance)));

            vertex.shade = Math.max(vertex.shade, Math.min(light.clip, (distanceMul * light.intensity)));
        }
    }

    return;
}
