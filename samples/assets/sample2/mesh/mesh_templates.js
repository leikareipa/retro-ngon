"use strict";

// Provides basic 3d objects for rendering. Note that these return an array of ngons, out of
// which you can then create a mesh.
const MeshTemplates =
{
    // The Cornell box. Adapted from measurements given in https://www.graphics.cornell.edu/online/box/data.html.
    cornell_box: function(hasSolidFill = true, hasWireframe = false)
    {
        const texture =
        {
            floor: null,
            ceiling: null,
            light: null,
            backWall: null,
            leftWall: null,
            rightWall: null,
            shortBlock: null,
            tallBlock: null,
        }

        const color =
        {
            white: Rngon.color_rgba(220, 220, 220),
            green: Rngon.color_rgba(0, 220, 0),
            red: Rngon.color_rgba(220, 0, 0),
            lightEmitter: Rngon.color_rgba(255, 255, 255),
        }

        return [
            // Floor.
            Rngon.ngon([Rngon.vertex4(556-552.8, 0, 0),
                        Rngon.vertex4(556-0, 0, 0),
                        Rngon.vertex4(556-0, 0, 559.2),
                        Rngon.vertex4(556-549.6, 0, 559.2)],
                       {
                           color: color.white,
                           texture: texture.floor,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Ceiling.
            Rngon.ngon([Rngon.vertex4(556-556, 548.8, 0),
                        Rngon.vertex4(556-556, 548.8, 559.2),
                        Rngon.vertex4(556-0, 548.8, 559.2),
                        Rngon.vertex4(556-0, 548.8, 0)],
                       {
                           color: color.white,
                           texture: texture.ceiling,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Light.
            Rngon.ngon([Rngon.vertex4(556-343, 548.8, 227),
                        Rngon.vertex4(556-343, 548.8, 332),
                        Rngon.vertex4(556-213, 548.8, 332),
                        Rngon.vertex4(556-213, 548.8, 227)],
                       {
                           color: color.lightEmitter,
                           texture: texture.light,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Back wall.
            Rngon.ngon([Rngon.vertex4(556-549.6, 0, 559.2),
                        Rngon.vertex4(556-0, 0, 559.2),
                        Rngon.vertex4(556-0, 548.8, 559.2),
                        Rngon.vertex4(556-556, 548.8, 559.2)],
                       {
                           color: color.white,
                           texture: texture.backWall,
                           hasSolidFill,
                           hasWireframe
                        }),

            // Right wall.
            Rngon.ngon([Rngon.vertex4(556-0, 0, 559.2),
                        Rngon.vertex4(556-0, 0, 0),
                        Rngon.vertex4(556-0, 548.8, 0),
                        Rngon.vertex4(556-0, 548.8, 559.2)],
                       {
                           color: color.green,
                           texture: texture.rightWall,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Left wall.
            Rngon.ngon([Rngon.vertex4(556-552.8, 0, 0),
                        Rngon.vertex4(556-549.6, 0, 559.2),
                        Rngon.vertex4(556-556, 548.8, 559.2),
                        Rngon.vertex4(556-556, 548.8, 0)],
                       {
                           color: color.red,
                           texture: texture.leftWall,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Tall block.
            Rngon.ngon([Rngon.vertex4(556-423, 330, 247),
                        Rngon.vertex4(556-265, 330, 296),
                        Rngon.vertex4(556-314, 330, 456),
                        Rngon.vertex4(556-472, 330, 406)],
                       {
                           color: color.white,
                           texture: texture.tallBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-472, 0, 406),
                        Rngon.vertex4(556-472, 330, 406),
                        Rngon.vertex4(556-314, 330, 456),
                        Rngon.vertex4(556-314, 0, 456)],
                       {
                           color: color.white,
                           texture: texture.tallBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-423, 0, 247),
                        Rngon.vertex4(556-423, 330, 247),
                        Rngon.vertex4(556-472, 330, 406),
                        Rngon.vertex4(556-472, 0, 406)],
                       {
                           color: color.white,
                           texture: texture.tallBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-314, 0, 456),
                        Rngon.vertex4(556-314, 330, 456),
                        Rngon.vertex4(556-265, 330, 296),
                        Rngon.vertex4(556-265, 0, 296)],
                       {
                           color: color.white,
                           texture: texture.tallBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-265, 0, 296),
                        Rngon.vertex4(556-265, 330, 296),
                        Rngon.vertex4(556-423, 330, 247),
                        Rngon.vertex4(556-423, 0, 247)],
                       {
                           color: color.white,
                           texture: texture.tallBlock,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Short block.
            Rngon.ngon([Rngon.vertex4(556-240, 0, 272),
                        Rngon.vertex4(556-240, 165, 272),
                        Rngon.vertex4(556-82, 165, 225),
                        Rngon.vertex4(556-82, 0, 225)],
                       {
                           color: color.white,
                           texture: texture.shortBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-290, 0, 114),
                        Rngon.vertex4(556-290, 165, 114),
                        Rngon.vertex4(556-240, 165, 272),
                        Rngon.vertex4(556-240, 0, 272)],
                       {
                           color: color.white,
                           texture: texture.shortBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-130, 0, 65),
                        Rngon.vertex4(556-130, 165, 65),
                        Rngon.vertex4(556-290, 165, 114),
                        Rngon.vertex4(556-290, 0, 114)],
                       {
                           color: color.white,
                           texture: texture.shortBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-82, 0, 225),
                        Rngon.vertex4(556-82, 165, 225),
                        Rngon.vertex4(556-130, 165, 65),
                        Rngon.vertex4(556-130, 0, 65)],
                       {
                           color: color.white,
                           texture: texture.shortBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
            Rngon.ngon([Rngon.vertex4(556-130, 165, 65),
                        Rngon.vertex4(556-82, 165, 225),
                        Rngon.vertex4(556-240, 165, 272),
                        Rngon.vertex4(556-290, 165, 114)],
                       {
                           color: color.white,
                           texture: texture.shortBlock,
                           hasSolidFill,
                           hasWireframe
                       }),
        ];
    },

    cube: function(texture = null, hasSolidFill = true, hasWireframe = false)
    {
        return [
            // Front.
            Rngon.ngon([Rngon.vertex4(-0.5, -0.5, -0.5),
                        Rngon.vertex4(-0.5, 0.5, -0.5),
                        Rngon.vertex4(0.5, 0.5, -0.5),
                        Rngon.vertex4(0.5, -0.5, -0.5)],
                       {
                           color: Rngon.color_rgba(180, 180, 180),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Back.
            Rngon.ngon([Rngon.vertex4(0.5, -0.5, 0.5),
                        Rngon.vertex4(0.5, 0.5, 0.5),
                        Rngon.vertex4(-0.5, 0.5, 0.5),
                        Rngon.vertex4(-0.5, -0.5, 0.5)],
                       {
                           color: Rngon.color_rgba(170, 170, 170),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Left.
            Rngon.ngon([Rngon.vertex4(-0.5, -0.5, 0.5),
                        Rngon.vertex4(-0.5, 0.5, 0.5),
                        Rngon.vertex4(-0.5, 0.5, -0.5),
                        Rngon.vertex4(-0.5, -0.5, -0.5)],
                       {
                           color: Rngon.color_rgba(135, 135, 135),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Right.
            Rngon.ngon([Rngon.vertex4(0.5, -0.5, -0.5),
                        Rngon.vertex4(0.5, 0.5, -0.5),
                        Rngon.vertex4(0.5, 0.5, 0.5),
                        Rngon.vertex4(0.5, -0.5, 0.5)],
                       {
                           color: Rngon.color_rgba(110, 110, 110),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Top.
            Rngon.ngon([Rngon.vertex4(0.5, -0.5, -0.5),
                        Rngon.vertex4(0.5, -0.5, 0.5),
                        Rngon.vertex4(-0.5, -0.5, 0.5),
                        Rngon.vertex4(-0.5, -0.5, -0.5)],
                       {
                           color: Rngon.color_rgba(200, 200, 200),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Bottom.
            Rngon.ngon([Rngon.vertex4(-0.5, 0.5, 0.5),
                        Rngon.vertex4(0.5, 0.5, 0.5),
                        Rngon.vertex4(0.5, 0.5, -0.5),
                        Rngon.vertex4(-0.5, 0.5, -0.5)],
                       {
                           color: Rngon.color_rgba(160, 160, 160),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),
        ];
    },

    pyramid: function(texture = null, hasSolidFill = true, hasWireframe = false)
    {
        return [
            // Sides.
            Rngon.ngon([Rngon.vertex4(-0.5, 0.5, -0.5),
                        Rngon.vertex4(0.5, 0.5, -0.5),
                        Rngon.vertex4(0, -0.5, 0)],
                       {
                           color: Rngon.color_rgba(180, 180, 180),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            Rngon.ngon([Rngon.vertex4(-0.5, 0.5, 0.5),
                        Rngon.vertex4(0.5, 0.5, 0.5),
                        Rngon.vertex4(0, -0.5, 0)],
                       {
                           color: Rngon.color_rgba(170, 170, 170),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            Rngon.ngon([Rngon.vertex4(-0.5, 0.5, -0.5),
                        Rngon.vertex4(-0.5, 0.5, 0.5),
                        Rngon.vertex4(0, -0.5, 0)],
                       {
                           color: Rngon.color_rgba(135, 135, 135),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            Rngon.ngon([Rngon.vertex4(0.5, 0.5, -0.5),
                        Rngon.vertex4(0.5, 0.5, 0.5),
                        Rngon.vertex4(0, -0.5, 0)],
                       {
                           color: Rngon.color_rgba(110, 110, 110),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),

            // Bottom.
            Rngon.ngon([Rngon.vertex4(-0.5, 0.5, 0.5),
                        Rngon.vertex4(0.5, 0.5, 0.5),
                        Rngon.vertex4(0.5, 0.5, -0.5),
                        Rngon.vertex4(-0.5, 0.5, -0.5)],
                       {
                           color: Rngon.color_rgba(160, 160, 160),
                           texture,
                           hasSolidFill,
                           hasWireframe
                       }),
        ]
    },

    disc: function(numSides = 20, texture = null, hasSolidFill = true, hasWireframe = false)
    {
        const angleDelta = ((2 * Math.PI) / numSides);
        const vertices = [...Array(numSides)]
                         .map((v, i)=>(Rngon.vertex4((Math.cos(i * angleDelta) * 0.5),
                                                     (Math.sin(i * angleDelta) * 0.5),
                                                     0)));
                                                     
        return [Rngon.ngon(vertices,
                           {
                               color: Rngon.color_rgba(180, 180, 180),
                               texture,
                               hasSolidFill,
                               hasWireframe
                           })];
    },
};
