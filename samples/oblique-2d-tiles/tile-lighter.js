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

export function apply_lighting_to_tile(renderContext, ngon)
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
    for (const light of renderContext.lights)
    {
        for (let v = 0; v < ngon.vertices.length; v++)
        {
            const vertex = ngon.vertices[v];
            let vX = vertex.x;
            let vY = vertex.y;

            // Transform the vertex positions to occur toward the (diamond-shaped) tile's
            // edges rather than at the transparent corners of its (square) polygon.
            // The polygon corners overlap other tiles' polygons, so lighting values
            // would be incorrect if computed at the corners.
            //
            // We also modify the top (#0 and #3) vertices' Y values to create a
            // unit tile, i.e. a tile as tall as wide, so that lighting tall tiles
            // (e.g. walls) is uniform with how ground tiles (unit size) are lit.
            const offset = (groundTileWidth / 8);
            switch (v)
            {
                case 0: vY = (ngon.vertices[1].y - groundTileHeight); vX += offset; vY += offset; break;
                case 1: vX += offset; vY -= offset; break;
                case 2: vX -= offset; vY -= offset; break;
                case 3: vY = (ngon.vertices[1].y - groundTileHeight); vX -= offset; vY += offset; break;
            }

            const distance = Math.sqrt(
                ((vX - light.x) ** 2) +
                ((vY - light.y) ** 2)
            );

            const distanceMul = (1 / (1 + distance));

            vertex.shade = Math.max(vertex.shade, Math.min(1, (distanceMul * light.intensity)));
        }
    }

    return;
}
