"use strict";

// The unit tester expects errors to throw, so make sure the renderer's assert handler
// throws on failure.
Rngon.assert = function(condition = false, explanation = "(no reason given)")
{
    if (!condition) throw Error(explanation);
}

const unitTestResults = unit_tests("Retro n-gon renderer", ()=>
{
    unit("4x4 matrix", ()=>
    {
        {
            const m = Rngon.matrix44.rotate(Rngon.trig.deg(10), Rngon.trig.deg(18), Rngon.trig.deg(380));
            expect_true([()=>(m.length === 16 && (trunc4(m[0])===0.8958  && trunc4(m[4])===0.3205  && trunc4(m[ 8])===-0.3078 && trunc4(m[12])===0.0000 && 
                                                  trunc4(m[1])===-0.2824 && trunc4(m[5])===0.9454  && trunc4(m[ 9])===0.1627 && trunc4(m[13])===0.0000 && 
                                                  trunc4(m[2])===0.3432  && trunc4(m[6])===-0.0588 && trunc4(m[10])===0.9374 && trunc4(m[14])===0.0000 && 
                                                  trunc4(m[3])===0.0000  && trunc4(m[7])===0.0000  && trunc4(m[11])===0.0000 && trunc4(m[15])===1.0000))]);
            expect_true([()=>(Object.isFrozen(m))]);
        }

        {
            const m = Rngon.matrix44.translate(452.8541, 2.5412, 8745.1645);
            expect_true([()=>(m.length === 16 && (trunc4(m[0])===1.0000 && trunc4(m[4])===0.0000 && trunc4(m[ 8])===0.0000 && trunc4(m[12])===452.8541  && 
                                                  trunc4(m[1])===0.0000 && trunc4(m[5])===1.0000 && trunc4(m[ 9])===0.0000 && trunc4(m[13])===2.5412    && 
                                                  trunc4(m[2])===0.0000 && trunc4(m[6])===0.0000 && trunc4(m[10])===1.0000 && trunc4(m[14])===8745.1645 && 
                                                  trunc4(m[3])===0.0000 && trunc4(m[7])===0.0000 && trunc4(m[11])===0.0000 && trunc4(m[15])===1.0000))]);
            expect_true([()=>(Object.isFrozen(m))]);
        }

        {
            const m = Rngon.matrix44.perspective(0.7545, 1.7155, 0.9138, 97852.8647);
            expect_true([()=>(m.length === 16 && (trunc4(m[0])===1.4712 && trunc4(m[4])===0.0000 && trunc4(m[ 8])===0.0000 && trunc4(m[12])===0.0000  && 
                                                  trunc4(m[1])===0.0000 && trunc4(m[5])===2.5238 && trunc4(m[ 9])===0.0000 && trunc4(m[13])===0.0000  && 
                                                  trunc4(m[2])===0.0000 && trunc4(m[6])===0.0000 && trunc4(m[10])===1.0000 && trunc4(m[14])===-1.8276 && 
                                                  trunc4(m[3])===0.0000 && trunc4(m[7])===0.0000 && trunc4(m[11])===1.0000 && trunc4(m[15])===0.0000))]);
            expect_true([()=>(Object.isFrozen(m))]);
        }

        {
            const m = Rngon.matrix44.ortho(4567.2434, 3.1284);
            expect_true([()=>(m.length === 16 && (trunc4(m[0])===2283.6217 && trunc4(m[4])===0.0000  && trunc4(m[ 8])===0.0000 && trunc4(m[12])===2283.1217 && 
                                                  trunc4(m[1])===0.0000    && trunc4(m[5])===-1.5642 && trunc4(m[ 9])===0.0000 && trunc4(m[13])===1.0642    && 
                                                  trunc4(m[2])===0.0000    && trunc4(m[6])===0.0000  && trunc4(m[10])===1.0000 && trunc4(m[14])===0.0000    && 
                                                  trunc4(m[3])===0.0000    && trunc4(m[7])===0.0000  && trunc4(m[11])===0.0000 && trunc4(m[15])===1.0000))]);
            expect_true([()=>(Object.isFrozen(m))]);
        }

        {
            const m = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.translate(452.8541, 2.5412, 8745.1645),
                                                         Rngon.matrix44.perspective(0.7545, 1.7155, 0.9138, 97852.8647));
            expect_true([()=>(m.length === 16 && (trunc4(m[0])===1.4712 && trunc4(m[4])===0.0000 && trunc4(m[ 8])===452.8541  && trunc4(m[12])===0.0000  && 
                                                  trunc4(m[1])===0.0000 && trunc4(m[5])===2.5238 && trunc4(m[ 9])===2.5412    && trunc4(m[13])===0.0000  && 
                                                  trunc4(m[2])===0.0000 && trunc4(m[6])===0.0000 && trunc4(m[10])===8746.1645 && trunc4(m[14])===-1.8276 && 
                                                  trunc4(m[3])===0.0000 && trunc4(m[7])===0.0000 && trunc4(m[11])===1.0000    && trunc4(m[15])===0.0000))]);
            expect_true([()=>(Object.isFrozen(m))]);
        }
    });

    unit("Geometry", function()
    {
        // Vertices.
        {
            const vertex = Rngon.vertex4(1.1, 2.2, 3.3);

            expect_true([()=>(vertex.x === 1.1),
                         ()=>(vertex.y === 2.2),
                         ()=>(vertex.z === 3.3)]);

            // Immutability.
            expect_fail([()=>{vertex.x = 0},
                         ()=>{vertex.y = 0},
                         ()=>{vertex.z = 0}]);
        }

        // Vectors.
        {
            const vector = Rngon.vector3(1.1, 2.2, 3.3);

            expect_true([()=>(vector.x === 1.1),
                         ()=>(vector.y === 2.2),
                         ()=>(vector.z === 3.3)]);

            // Immutability.
            expect_fail([()=>{vector.x = 0},
                         ()=>{vector.y = 0},
                         ()=>{vector.z = 0}]);
        }

        // N-gons.
        {
            const vertex = Rngon.vertex4(1.1, 2.2, 3.3);
            const ngon = Rngon.ngon([vertex],
                                    {color: Rngon.color_rgba(0, 111, 222), texture: null, hasSolidFill: true, hasWireframe: false});

            expect_true([()=>(ngon.vertices.length === 1),
                         ()=>(ngon.vertices[0] === vertex),
                         ()=>(ngon.color.red === 0),
                         ()=>(ngon.color.green === 111),
                         ()=>(ngon.color.blue === 222),
                         ()=>(ngon.texture === null),
                         ()=>(ngon.hasSolidFill === true),
                         ()=>(ngon.hasWireframe === false)]);

            // Immutability.
            expect_fail([()=>{ngon.vertices = 0},
                         ()=>{ngon.vertices[0] = 0},
                         ()=>{ngon.texture = 0},
                         ()=>{ngon.color = 0},
                         ()=>{ngon.hasSolidFill = 0},
                         ()=>{ngon.hasWireframe = 0}]);
        }

        // Meshes.
        {
            const vertex = Rngon.vertex4(1.1, 2.2, 3.3);
            const ngon = Rngon.ngon([vertex],
                                    {color: Rngon.color_rgba(0, 111, 222), texture: null, hasSolidFill: true, hasWireframe: false});
            const mesh = Rngon.mesh([ngon],
                                    {
                                        translation: Rngon.translation_vector(1, 2, 3),
                                        rotation: Rngon.rotation_vector(4, 5, 6),
                                        scaling: Rngon.scaling_vector(7, 8, 9)
                                    });

            expect_true([()=>(mesh.ngons.length === 1),
                         ()=>((mesh.translation.x === 1 && mesh.translation.y === 2 && mesh.translation.z === 3)),
                         ()=>((mesh.rotation.x === Rngon.trig.deg(4) && mesh.rotation.y === Rngon.trig.deg(5)) && mesh.rotation.z === Rngon.trig.deg(6)),
                         ()=>((mesh.scale.x === 7 && mesh.scale.y === 8 && mesh.scale.z === 9))]);

            // Immutability.
            expect_fail([()=>{mesh.ngons = 0},
                         ()=>{mesh.ngons[0] = 0},
                         ()=>{mesh.rotation = 0},
                         ()=>{mesh.translation = 0},
                         ()=>{mesh.objectSpaceMatrix = 0},
                         ()=>{mesh.objectSpaceMatrix[0] = 0}]);
        }
    });

    unit("Color", ()=>
    {
        const color = Rngon.color_rgba(1, 2, 3, 4);

        expect_true([()=>(color.red === 1),
                     ()=>(color.green === 2),
                     ()=>(color.blue === 3),
                     ()=>(color.alpha === 4)]);

        expect_true([()=>(color.as_hex() === "#01020304"),
                     ()=>(color.as_hex(0x1110) === "#010203"),
                     ()=>(color.as_hex(0x1000) === "#010000"),
                     ()=>(color.as_hex(0x0100) === "#000200"),
                     ()=>(color.as_hex(0x0010) === "#000003"),
                     ()=>(color.as_hex(0x0011) === "#00000304")])

        // Immutability.
        expect_fail([()=>{color.red = 1},
                     ()=>{color.green = 1},
                     ()=>{color.blue = 1}]);

        // Values out of bounds.
        expect_fail([()=>{Rngon.color_rgba(256, 255, 255)},
                     ()=>{Rngon.color_rgba(-1, 255, 255)}]);
    });

    unit("Texture (RGBA)", ()=>
    {
        const texture = Rngon.texture_rgba({width: 1, height: 1, encoding: "none", pixels: [255, 22, 1, 255]});
        const textureSeethrough = Rngon.texture_rgba({width: 1, height: 1, encoding: "none", pixels: [255, 22, 1, 1]});

        expect_true([()=>(texture.width === 1),
                     ()=>(texture.height === 1),
                     ()=>((texture.rgba_channels_at(0, 0) instanceof Array)),
                     ()=>(texture.rgba_channels_at(0, 0).length === 4),
                     ()=>(texture.rgba_channels_at(0, 0)[0] === 255),
                     ()=>(texture.rgba_channels_at(0, 0)[1] === 22),
                     ()=>(texture.rgba_channels_at(0, 0)[2] === 1),
                     ()=>(texture.rgba_channels_at(0, 0)[3] === 255),
                     ()=>(textureSeethrough.rgba_channels_at(0, 0)[3] === 1)]);

        // Immutability.
        expect_fail([()=>{texture.width = 0},
                     ()=>{texture.height = 0},
                     ()=>{texture.pixels = 0},
                     ()=>{texture.pixels[0] = 0}]);

        // Invalid values.
        expect_fail([()=>{Rngon.texture_rgba({width: 1, height: 1, encoding: "none", pixels: [255, 0, 0, 0]}).rgba_channels_at(1, 0)}, // Access out of bounds.
                     ()=>{Rngon.texture_rgba({width: 1, height: 1, encoding: "none", pixels: [255, 0, 0, 0, 255, 0, 0, 0]})}, // Too many pixels for given resolution.
                     ()=>{Rngon.texture_rgba({width: 2, height: 1, encoding: "none", pixels: [255, 0, 0, 0]})}, // Not enough pixels for given resolution.
                     ()=>{Rngon.texture_rgba({width: 1, height: 1, encoding: "none", pixels: [255, 22, 1]})}, // Missing pixel alpha channel.
                     ()=>{Rngon.texture_rgba({width: -1, height: 1, encoding: "none", pixels: [255, 22, 1, 0]})}, // Negative height.
                     ()=>{Rngon.texture_rgba({width: 1, height: 1, encoding: "base64", pixels: "D"})}, // Missing pixel channels.
                     ()=>{Rngon.texture_rgba({width: 1, height: 1, encoding: "qzxwesdxcdrfvgyhnmjiklp"})}]); // Invalid encoder id.
    });

    // The renderer.
    {
        // Create a test canvas we can render into.
        const testCanvasId = "test-canvas";
        const testCanvasWidth = 10;
        const testCanvasHeight = 10;
        const canvas = document.createElement("canvas");
        canvas.setAttribute("id", testCanvasId);
        canvas.style.width = (testCanvasWidth + "px");
        canvas.style.height = (testCanvasHeight + "px");
        document.body.appendChild(canvas);
        
        unit("Render surface", ()=>
        {
            expect_true([()=>(document.getElementById(testCanvasId) !== null)]);

            const renderSurface = Rngon.screen(testCanvasId, Rngon.ngon_filler, Rngon.ngon_transformer, 1);

            expect_true([()=>(renderSurface.width === testCanvasWidth),
                         ()=>(renderSurface.height === testCanvasHeight)]);

            // Immutability.
            expect_fail([()=>{renderSurface.width = 0},
                         ()=>{renderSurface.height = 0}]);
        });
        
        unit("Renderer", function()
        {
            expect_true([()=>(document.getElementById(testCanvasId) !== null)]);

            // Create a colored rectangle that fills the entire canvas when rendered.
            const colorShade = 222;
            const ngon = Rngon.ngon([Rngon.vertex4(-1, -1, 1),
                                     Rngon.vertex4(1, -1, 1),
                                     Rngon.vertex4(1, 1, 1),
                                     Rngon.vertex4(-1, 1, 1)],
                                    {
                                        color: Rngon.color_rgba(colorShade, colorShade, colorShade, colorShade),
                                        texture: null,
                                        hasSolidFill: true,
                                        hasWireframe: false
                                    });
            const mesh = Rngon.mesh([ngon],
                                    {
                                        translation: Rngon.translation_vector(0, 0, 0),
                                        rotation: Rngon.rotation_vector(0, 0, 0),
                                        scaling: Rngon.scaling_vector(1, 1, 1)
                                    });
 
            // Render the rectangle into the canvas, and check that the canvas came to have correctly-colored pixels.
            {
                {
                    const pixelMap = canvas.getContext("2d").getImageData(0, 0, testCanvasWidth, testCanvasHeight).data;
                    expect_true([()=>(pixelMap.every((p)=>(p !== colorShade)))]);
                }

                Rngon.render(testCanvasId, [mesh], Rngon.vector3(0, 0, 0), Rngon.vector3(0, 0, 0), 1);

                {
                    const pixelMap = canvas.getContext("2d").getImageData(0, 0, testCanvasWidth, testCanvasHeight).data;
                    expect_true([()=>(pixelMap.every((p)=>(p === colorShade)))]);
                }
            }
        });

        canvas.remove();
    }
});

// Output the test results as HTML.
{
    const resultsTableElement = document.createElement("table");

    unitTestResults.forEach((r, idx)=>
    {
        if (idx === 0)
        {
            const header = document.createElement("th");
            header.setAttribute("colspan", "2");
            header.appendChild(document.createTextNode(r));
            header.style.backgroundColor = "lightgray";

            resultsTableElement.appendChild(header);
        }
        else
        {
            const newRow = document.createElement("tr");
            newRow.className = (r.passed? "pass" : "fail");
            
            const unitName = document.createElement("td");
            unitName.appendChild(document.createTextNode(r.unitName));

            const testResult = document.createElement("td");
            testResult.appendChild(document.createTextNode(r.passed? "Passed" : "Failed"));

            newRow.appendChild(unitName);
            newRow.appendChild(testResult)
            resultsTableElement.appendChild(newRow);

            if (!r.passed) console.log(r.unitName, "fail:", r.error)
        }
    });

    document.body.appendChild(resultsTableElement);
    document.body.appendChild(document.createTextNode(Date()));
}
