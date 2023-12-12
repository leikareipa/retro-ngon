/*
 * 2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Vertex} from "../../../api/vertex.mjs";
import {Color} from "../../../api/color.mjs";

export function point_plain_fill(
    renderContext,
    vertex = Vertex(),
    color = Color(),
)
{
    renderContext.pixelBuffer32[Math.floor(vertex.x) + Math.floor(vertex.y) * renderContext.pixelBuffer.width] = (
        (255 << 24) +
        (color.blue << 16) +
        (color.green << 8) +
        ~~color.red
    );

    return true;
}
