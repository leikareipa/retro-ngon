/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

import {
    msSansSerif8Regular,
    msSansSerif8Bold
} from "./font.js";

const noteWidth = 117;
const noteHeight = 48;

const backgroundShadow = Rngon.ngon([
    Rngon.vertex(0,         0         ),
    Rngon.vertex(0,         noteHeight),
    Rngon.vertex(noteWidth, noteHeight),
    Rngon.vertex(noteWidth, 0         ),
], {
    color: Rngon.color.black,
    isInScreenSpace: true,
});

const background = Rngon.ngon([
    Rngon.vertex(-10,           -10           ),
    Rngon.vertex(-10,           -10+noteHeight),
    Rngon.vertex(-10+noteWidth, -10+noteHeight),
    Rngon.vertex(-10+noteWidth, -10           ),
], {
    color: Rngon.color.whitesmoke,
    isInScreenSpace: true,
});

export const sample = {
    initialize: function() {},
    tick: function()
    {
        const dateString = new Date().toLocaleTimeString("en-US", {hour12: false}).replace(/^0/, "");

        return {
            mesh: Rngon.mesh([
                backgroundShadow,
                background,
                ...string_to_ngons(`Aa Bb Cc 1 + 2 = 3.4\nThe time is *${dateString}*.`)], {
                    // Center the mesh on the screen.
                    translate: Rngon.vector(
                        ((Rngon.context.default.resolution.width / 2) - (noteWidth / 2)),
                        ((Rngon.context.default.resolution.height / 2) - (noteHeight / 2) + 10),
                    ),
            }),
            renderOptions: {
                // We've manually pre-sorted the n-gons in the mesh, so depth
                // buffering isn't needed.
                useDepthBuffer: false,

                useBackfaceCulling: false,
            },
            renderPipeline: {
                rasterPath: blitter,              
            },
        };
    },
};

function string_to_ngons(text = "Hello there")
{
    const charset = [
        msSansSerif8Regular,
        msSansSerif8Bold
    ];
    const letterSpacing = 1;
    const wordSpacing = 2;
    const lineSpacing = (charset[0].lineHeight + 2);

    let x = 0;
    let y = 0;

    return text.split("").map(char=>{
        const charCode = char.charCodeAt(0);

        // * (control character that switches between bold and regular font).
        if (charCode === 42) {
            charset.reverse();
            return Rngon.ngon([]);
        }

        // Space.
        if (charCode === 32) {
            x += (wordSpacing * letterSpacing);
            return Rngon.ngon([]);
        }

        // Newline.
        if (charCode === 10) {
            x = 0;
            y += lineSpacing;
            return Rngon.ngon([]);
        }

        const glyph = (charset[0][charCode] || charset[0][63]);
        x += glyph.leftSpacing;

        const ngon = Rngon.ngon([
            Rngon.vertex( x,                 y                ),
            Rngon.vertex( x,                (y + glyph.height)),
            Rngon.vertex((x + glyph.width), (y + glyph.height)),
            Rngon.vertex((x + glyph.width),  y                ),
        ], {
            color: Rngon.color.black,
            texture: glyph,
            isInScreenSpace: true,
        });

        x += (glyph.width + letterSpacing);

        return ngon;
    });
}

// Custom raster path that blits solid-filled rectangles and textured bitmap
// font characters. Faster for this purpose than using the renderer's default
// raster paths.
function blitter({
    renderContext,
    ngon,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    if (!numLeftEdges || !numRightEdges)
    {
        return;
    }

    const pixelBufferWidth = renderContext.pixelBuffer.width;
    const material = ngon.material;
    const texture = (material.texture || null);

    let curLeftEdgeIdx = 0;
    let curRightEdgeIdx = 0;
    let leftEdge = leftEdges[curLeftEdgeIdx];
    let rightEdge = rightEdges[curRightEdgeIdx];

    // Note: We assume the n-gon's vertices to be sorted by increasing Y.
    const ngonStartY = leftEdges[0].top;
    const ngonEndY = leftEdges[numLeftEdges-1].bottom;

    // Blit.
    if (!texture)
    {
        const spanStartX = Math.min(pixelBufferWidth, Math.max(0, Math.round(leftEdge.x)));
        const spanEndX = Math.min(pixelBufferWidth, Math.max(0, Math.ceil(rightEdge.x)));
        const color = (
            (material.color.alpha << 24) +
            (material.color.blue << 16) +
            (material.color.green << 8) +
            ~~material.color.red
        )

        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            let pixelBufferIdx = (spanStartX + y * pixelBufferWidth);

            for (let x = spanStartX; x < spanEndX; x++)
            {
                renderContext.pixelBuffer32[pixelBufferIdx++] = color;
            }
        }
    }
    else
    {
        const spanStartX = Math.min(pixelBufferWidth, Math.max(0, Math.round(leftEdge.x)));
        const spanEndX = Math.min(pixelBufferWidth, Math.max(0, Math.ceil(rightEdge.x)));
        const pixels = texture.pixels;

        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            let pixelBufferIdx = ((y * pixelBufferWidth) + spanStartX);
            let texelIdx = ~~(((y - ngonStartY) * texture.width) * 4);

            for (let x = spanStartX; x < spanEndX; x++)
            {
                if (pixels[texelIdx + 3] === 255)
                {
                    const red   = (pixels[texelIdx + 0] * material.color.unitRange.red);
                    const green = (pixels[texelIdx + 1] * material.color.unitRange.green);
                    const blue  = (pixels[texelIdx + 2] * material.color.unitRange.blue);
                                  
                    renderContext.pixelBuffer32[pixelBufferIdx] = (
                        (255 << 24) +
                        (blue << 16) +
                        (green << 8) +
                        ~~red
                    );
                }

                pixelBufferIdx++;
                texelIdx += 4;
            }
        }
    }

    return true;
}
