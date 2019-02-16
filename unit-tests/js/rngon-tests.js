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
            const m = Rngon.matrix44.identity();
            expect_true([m.length === 16 && m[0]===1 && m[4]===0 && m[ 8]===0 && m[12]===0 &&
                                            m[1]===0 && m[5]===1 && m[ 9]===0 && m[13]===0 &&
                                            m[2]===0 && m[6]===0 && m[10]===1 && m[14]===0 &&
                                            m[3]===0 && m[7]===0 && m[11]===0 && m[15]===1]);
        }
        
        {
            const m = Rngon.matrix44.rotate(-1.6572, 0.3457, -874665.5247);
            expect_true([m.length === 16 && (trunc4(m[0])===-0.5131 && trunc4(m[4])===-0.7886 && trunc4(m[ 8])===-0.3389 && trunc4(m[12])===0.0000 && 
                                             trunc4(m[1])===0.1118  && trunc4(m[5])===0.3300  && trunc4(m[ 9])===-0.9373 && trunc4(m[13])===0.0000 && 
                                             trunc4(m[2])===0.8510  && trunc4(m[6])===-0.5188 && trunc4(m[10])===-0.0812 && trunc4(m[14])===0.0000 && 
                                             trunc4(m[3])===0.0000  && trunc4(m[7])===0.0000  && trunc4(m[11])===0.0000  && trunc4(m[15])===1.0000)]);
        }

        {
            const m = Rngon.matrix44.translate(452.8541, 2.5412, 8745.1645);
            expect_true([m.length === 16 && (trunc4(m[0])===1.0000 && trunc4(m[4])===0.0000 && trunc4(m[ 8])===0.0000 && trunc4(m[12])===452.8541  && 
                                             trunc4(m[1])===0.0000 && trunc4(m[5])===1.0000 && trunc4(m[ 9])===0.0000 && trunc4(m[13])===2.5412    && 
                                             trunc4(m[2])===0.0000 && trunc4(m[6])===0.0000 && trunc4(m[10])===1.0000 && trunc4(m[14])===8745.1645 && 
                                             trunc4(m[3])===0.0000 && trunc4(m[7])===0.0000 && trunc4(m[11])===0.0000 && trunc4(m[15])===1.0000)]);
        }

        {
            const m = Rngon.matrix44.perspective(0.7545, 1.7155, 0.9138, 97852.8647);
            expect_true([m.length === 16 && (trunc4(m[0])===1.4712 && trunc4(m[4])===0.0000 && trunc4(m[ 8])===0.0000 && trunc4(m[12])===0.0000  && 
                                             trunc4(m[1])===0.0000 && trunc4(m[5])===2.5238 && trunc4(m[ 9])===0.0000 && trunc4(m[13])===0.0000  && 
                                             trunc4(m[2])===0.0000 && trunc4(m[6])===0.0000 && trunc4(m[10])===1.0000 && trunc4(m[14])===-1.8276 && 
                                             trunc4(m[3])===0.0000 && trunc4(m[7])===0.0000 && trunc4(m[11])===1.0000 && trunc4(m[15])===0.0000)]);
        }

        {
            const m = Rngon.matrix44.screen_space(4567.2434, 3.1284);
            expect_true([m.length === 16 && (trunc4(m[0])===2283.6217 && trunc4(m[4])===0.0000  && trunc4(m[ 8])===0.0000 && trunc4(m[12])===2283.1217 && 
                                             trunc4(m[1])===0.0000    && trunc4(m[5])===-1.5642 && trunc4(m[ 9])===0.0000 && trunc4(m[13])===1.0642    && 
                                             trunc4(m[2])===0.0000    && trunc4(m[6])===0.0000  && trunc4(m[10])===1.0000 && trunc4(m[14])===0.0000    && 
                                             trunc4(m[3])===0.0000    && trunc4(m[7])===0.0000  && trunc4(m[11])===0.0000 && trunc4(m[15])===1.0000)]);
        }

        {
            const m = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.translate(452.8541, 2.5412, 8745.1645),
                                                         Rngon.matrix44.perspective(0.7545, 1.7155, 0.9138, 97852.8647));
            expect_true([m.length === 16 && (trunc4(m[0])===1.4712 && trunc4(m[4])===0.0000 && trunc4(m[ 8])===452.8541  && trunc4(m[12])===0.0000  && 
                                             trunc4(m[1])===0.0000 && trunc4(m[5])===2.5238 && trunc4(m[ 9])===2.5412    && trunc4(m[13])===0.0000  && 
                                             trunc4(m[2])===0.0000 && trunc4(m[6])===0.0000 && trunc4(m[10])===8746.1645 && trunc4(m[14])===-1.8276 && 
                                             trunc4(m[3])===0.0000 && trunc4(m[7])===0.0000 && trunc4(m[11])===1.0000    && trunc4(m[15])===0.0000)]);
        }
    });

    unit("Geometry", function()
    {
        const vertex = Rngon.vertex4(1.1, 2.2, 3.3);

        expect_true([vertex.x === 1.1,
                     vertex.y === 2.2,
                     vertex.z === 3.3]);

        // Immutability.
        expect_fail([()=>{vertex.x = 0},
                     ()=>{vertex.y = 0},
                     ()=>{vertex.z = 0}]);

        const vector = Rngon.vector3(1.1, 2.2, 3.3);

        expect_true([vector.x === 1.1,
                     vector.y === 2.2,
                     vector.z === 3.3]);

        // Immutability.
        expect_fail([()=>{vector.x = 0},
                     ()=>{vector.y = 0},
                     ()=>{vector.z = 0}]);

        const ng = Rngon.ngon([vertex], Rngon.color_rgba(0, 111, 222), null, true, false);

        expect_true([ng.vertices.length === 1,
                     ng.vertices[0] === vertex,
                     ng.color.red === 0,
                     ng.color.green === 111,
                     ng.color.blue === 222,
                     ng.texture === null,
                     ng.hasSolidFill === true,
                     ng.hasWireframe === false]);

        // Immutability.
        expect_fail([()=>{ng.vertices = 0},
                     ()=>{ng.vertices[0] = 0},
                     ()=>{ng.texture = 0},
                     ()=>{ng.color = 0},
                     ()=>{ng.hasSolidFill = 0},
                     ()=>{ng.hasWireframe = 0}]);

        const mesh = Rngon.mesh([ng], Rngon.translation_vector(1, 1, 1), Rngon.rotation_vector(2, 2, 2), Rngon.scaling_vector(3, 3, 3));

        expect_true([mesh.ngons.length === 1,
                     mesh.translation.x === 1,
                     mesh.rotation.x === 2,
                     mesh.scale.x === 3]);

        // Immutability.
        expect_fail([()=>{mesh.ngons = 0},
                     ()=>{mesh.rotation = 0},
                     ()=>{mesh.translation = 0},
                     ()=>{mesh.objectSpaceMatrix = 0}]);
    });

    unit("Color", ()=>
    {
        const color = Rngon.color_rgba(1, 2, 3, 4);

        expect_true([color.red === 1,
                     color.green === 2,
                     color.blue === 3,
                     color.alpha === 4]);

        expect_true([color.as_hex() === "#01020304",
                     color.as_hex(0x1110) === "#010203",
                     color.as_hex(0x1000) === "#010000",
                     color.as_hex(0x0100) === "#000200",
                     color.as_hex(0x0010) === "#000003",
                     color.as_hex(0x0011) === "#00000304"])

        // Immutability.
        expect_fail([()=>{color.red = 1},
                     ()=>{color.green = 1},
                     ()=>{color.blue = 1}]);

        // Values out of bounds.
        expect_fail([()=>{Rngon.color_rgba(256, 255, 255)},
                     ()=>{Rngon.color_rgba(-1, 255, 255)}]);
    });

    unit("Texture", ()=>
    {
        const texture = Rngon.texture_rgb({width: 1, height: 1, pixels: [255, 22, 1]});

        expect_true([texture.width === 1,
                     texture.height === 1,
                     texture.rgba_pixel_at(0, 0).red === 255,
                     texture.rgba_pixel_at(0, 0).green === 22,
                     texture.rgba_pixel_at(0, 0).blue === 1]);

        // Immutability.
        expect_fail([()=>{texture.width = 0},
                     ()=>{texture.height = 0},
                     ()=>{texture.pixels = 0},
                     ()=>{texture.pixels[0] = 0}]);

        // Invalid values.
        expect_fail([()=>{texture.rgba_pixel_at(2, 0)},
                     ()=>{Rngon.texture_rgb({width: 1, height: 1, pixels: [255, 0, 0, 255, 0, 0]})},
                     ()=>{Rngon.texture_rgb({width: 2, height: 1, pixels: [255, 0, 0]})}]);
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
            expect_true([document.getElementById(testCanvasId) !== null]);

            const renderSurface = Rngon.canvas(testCanvasId, Rngon.ngon_filler, Rngon.ngon_transformer, 1);

            expect_true([renderSurface.width === testCanvasWidth,
                         renderSurface.height === testCanvasHeight]);

            // Immutability.
            expect_fail([()=>{renderSurface.width = 0},
                         ()=>{renderSurface.height = 0}]);
        });
        
        unit("Renderer", function()
        {
            expect_true([document.getElementById(testCanvasId) !== null]);

            // Create a colored rectangle that fills the entire canvas when rendered.
            const colorShade = 222;
            const mesh = Rngon.mesh([Rngon.ngon([Rngon.vertex4(-1, -1, 1),
                                                 Rngon.vertex4(1, -1, 1),
                                                 Rngon.vertex4(1, 1, 1),
                                                 Rngon.vertex4(-1, 1, 1)],
                                                Rngon.color_rgba(colorShade, colorShade, colorShade, colorShade))],
                                                Rngon.translation_vector(0, 0, 0),
                                                Rngon.rotation_vector(0, 0, 0),
                                                Rngon.scaling_vector(1, 1, 1));
 
            // Render the rectangle into the canvas, and check that the canvas came to have correctly-colored pixels.
            {
                {
                    const pixelMap = canvas.getContext("2d").getImageData(0, 0, testCanvasWidth, testCanvasHeight).data;
                    expect_true([pixelMap.every((p)=>(p !== colorShade))]);
                }

                Rngon.render(testCanvasId, [mesh], Rngon.vector3(0, 0, 0), Rngon.vector3(0, 0, 0), 1);

                {
                    const pixelMap = canvas.getContext("2d").getImageData(0, 0, testCanvasWidth, testCanvasHeight).data;
                    expect_true([pixelMap.every((p)=>(p === colorShade))]);
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
}
