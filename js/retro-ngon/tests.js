"use strict"

unit_tester.run_tests("Retro n-gon renderer", ()=>
{
    unit_tester.test_unit("4x4 matrix", ()=>
    {
        {
            const m = Rngon.matrix44.identity();
            unit_tester.require(m.length === 16 && (m[0]===1 && m[4]===0 && m[ 8]===0 && m[12]===0 &&
                                m[1]===0 && m[5]===1 && m[ 9]===0 && m[13]===0 &&
                                m[2]===0 && m[6]===0 && m[10]===1 && m[14]===0 &&
                                m[3]===0 && m[7]===0 && m[11]===0 && m[15]===1),
                                "Valid identity matrix.");
        }
        
        {
            const m = Rngon.matrix44.rotate(-1.6572, 0.3457, -874665.5247);
            unit_tester.require(m.length === 16 && (unit_tester.tr4(m[0])===-0.5131 && unit_tester.tr4(m[4])===-0.7886 && unit_tester.tr4(m[ 8])===-0.3389 && unit_tester.tr4(m[12])===0.0000 && 
                                unit_tester.tr4(m[1])===0.1118  && unit_tester.tr4(m[5])===0.3300  && unit_tester.tr4(m[ 9])===-0.9373 && unit_tester.tr4(m[13])===0.0000 && 
                                unit_tester.tr4(m[2])===0.8510  && unit_tester.tr4(m[6])===-0.5188 && unit_tester.tr4(m[10])===-0.0812 && unit_tester.tr4(m[14])===0.0000 && 
                                unit_tester.tr4(m[3])===0.0000  && unit_tester.tr4(m[7])===0.0000  && unit_tester.tr4(m[11])===0.0000  && unit_tester.tr4(m[15])===1.0000),
                                "Valid rotation matrix.");
        }

        {
            const m = Rngon.matrix44.translate(452.8541, 2.5412, 8745.1645);
            unit_tester.require(m.length === 16 && (unit_tester.tr4(m[0])===1.0000 && unit_tester.tr4(m[4])===0.0000 && unit_tester.tr4(m[ 8])===0.0000 && unit_tester.tr4(m[12])===452.8541  && 
                                unit_tester.tr4(m[1])===0.0000 && unit_tester.tr4(m[5])===1.0000 && unit_tester.tr4(m[ 9])===0.0000 && unit_tester.tr4(m[13])===2.5412    && 
                                unit_tester.tr4(m[2])===0.0000 && unit_tester.tr4(m[6])===0.0000 && unit_tester.tr4(m[10])===1.0000 && unit_tester.tr4(m[14])===8745.1645 && 
                                unit_tester.tr4(m[3])===0.0000 && unit_tester.tr4(m[7])===0.0000 && unit_tester.tr4(m[11])===0.0000 && unit_tester.tr4(m[15])===1.0000),
                                "Valid translation matrix.");
        }

        {
            const m = Rngon.matrix44.perspective(0.7545, 1.7155, 0.9138, 97852.8647);
            unit_tester.require(m.length === 16 && (unit_tester.tr4(m[0])===1.4712 && unit_tester.tr4(m[4])===0.0000 && unit_tester.tr4(m[ 8])===0.0000 && unit_tester.tr4(m[12])===0.0000  && 
                                unit_tester.tr4(m[1])===0.0000 && unit_tester.tr4(m[5])===2.5238 && unit_tester.tr4(m[ 9])===0.0000 && unit_tester.tr4(m[13])===0.0000  && 
                                unit_tester.tr4(m[2])===0.0000 && unit_tester.tr4(m[6])===0.0000 && unit_tester.tr4(m[10])===1.0000 && unit_tester.tr4(m[14])===-1.8276 && 
                                unit_tester.tr4(m[3])===0.0000 && unit_tester.tr4(m[7])===0.0000 && unit_tester.tr4(m[11])===1.0000 && unit_tester.tr4(m[15])===0.0000),
                                "Valid perspective matrix.");
        }

        {
            const m = Rngon.matrix44.screen_space(4567.2434, 3.1284);
            unit_tester.require(m.length === 16 && (unit_tester.tr4(m[0])===2283.6217 && unit_tester.tr4(m[4])===0.0000  && unit_tester.tr4(m[ 8])===0.0000 && unit_tester.tr4(m[12])===2283.1217 && 
                                unit_tester.tr4(m[1])===0.0000    && unit_tester.tr4(m[5])===-1.5642 && unit_tester.tr4(m[ 9])===0.0000 && unit_tester.tr4(m[13])===1.0642    && 
                                unit_tester.tr4(m[2])===0.0000    && unit_tester.tr4(m[6])===0.0000  && unit_tester.tr4(m[10])===1.0000 && unit_tester.tr4(m[14])===0.0000    && 
                                unit_tester.tr4(m[3])===0.0000    && unit_tester.tr4(m[7])===0.0000  && unit_tester.tr4(m[11])===0.0000 && unit_tester.tr4(m[15])===1.0000),
                                "Valid screen-space matrix.");
        }

        {
            const m = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.translate(452.8541, 2.5412, 8745.1645),
                                                   Rngon.matrix44.perspective(0.7545, 1.7155, 0.9138, 97852.8647));
            unit_tester.require(m.length === 16 && (unit_tester.tr4(m[0])===1.4712 && unit_tester.tr4(m[4])===0.0000 && unit_tester.tr4(m[ 8])===452.8541  && unit_tester.tr4(m[12])===0.0000  && 
                                unit_tester.tr4(m[1])===0.0000 && unit_tester.tr4(m[5])===2.5238 && unit_tester.tr4(m[ 9])===2.5412    && unit_tester.tr4(m[13])===0.0000  && 
                                unit_tester.tr4(m[2])===0.0000 && unit_tester.tr4(m[6])===0.0000 && unit_tester.tr4(m[10])===8746.1645 && unit_tester.tr4(m[14])===-1.8276 && 
                                unit_tester.tr4(m[3])===0.0000 && unit_tester.tr4(m[7])===0.0000 && unit_tester.tr4(m[11])===1.0000    && unit_tester.tr4(m[15])===0.0000),
                                "Valid matrix multiplication.");
        }
    });

    unit_tester.test_unit("Geometry", function()
    {
        const vertex = Rngon.vertex4(1.1, 2.2, 3.3);
        unit_tester.require((vertex.x === 1.1 && vertex.y === 2.2 && vertex.z === 3.3), "Creation of a vertex4.");
        unit_tester.reject(()=>{vertex.x = 0}, "Immutable vertex4.");

        const vector = Rngon.vector3(1.1, 2.2, 3.3);
        unit_tester.require((vector.x === 1.1 && vector.y === 2.2 && vector.z === 3.3), "Creation of a vector3.");
        unit_tester.reject(()=>{vector.x = 0}, "Immutable vector3.");

        const ng = Rngon.ngon([vertex], Rngon.color_rgba(0, 111, 222), null, true, false);
        unit_tester.require((ng.vertices.length === 1 &&
                             ng.vertices[0] === vertex &&
                             ng.color.red === 0 && ng.color.green === 111 && ng.color.blue === 222 &&
                             ng.texture === null &&
                             ng.hasSolidFill === true &&
                             ng.hasWireframe === false), "Creation of an ngon.");
        unit_tester.reject(()=>{ng.vertices = null}, "Immutable ngon.");

        const mesh = Rngon.mesh([ng], Rngon.translation_vector(1, 1, 1), Rngon.rotation_vector(2, 2, 2), Rngon.scaling_vector(3, 3, 3));
        unit_tester.require((mesh.ngons.length === 1 &&
                             mesh.translation.x === 1 &&
                             mesh.rotation.x === 2 &&
                             mesh.scale.x === 3), "Creation of an ngon mesh.");
        unit_tester.reject(()=>{mesh.ngons = null}, "Immutable ngon mesh.");
    });

    unit_tester.test_unit("Color", function()
    {
        const color = Rngon.color_rgba(1, 2, 3, 4);
        unit_tester.require((color.red === 1 && color.green === 2 && color.blue === 3 && color.alpha === 4), "Creation of a color.");
        unit_tester.require((color.as_hex() === "#01020304"), "Color conversion from RGBA to hex with alpha");
        unit_tester.require((color.as_hex(0x1110) === "#010203"), "Color conversion from RGBA to hex without alpha");
        unit_tester.require((color.as_hex(0x1000) === "#010000"), "Color conversion from RGBA to hex without alpha, masking all but red");
        unit_tester.require((color.as_hex(0x0100) === "#000200"), "Color conversion from RGBA to hex without alpha, masking all but green");
        unit_tester.require((color.as_hex(0x0010) === "#000003"), "Color conversion from RGBA to hex without alpha, masking all but blue");
        unit_tester.require((color.as_hex(0x0011) === "#00000304"), "Color conversion from RGBA to hex with alpha, masking all but blue");
        unit_tester.reject(()=>{color.red = 0}, "Immutable color.");
        unit_tester.reject(()=>{Rngon.color_rgba(256)}, "Reject invalid color arguments: red overflow.");
    });

    unit_tester.test_unit("Texture", function()
    {
        const texture = Rngon.rgb_texture({width: 1, height: 1, pixels: [255, 0, 0]});
        unit_tester.require((texture.width === 1 && texture.height === 1 &&
                             texture.rgba_pixel_at(0, 0).red === 255 &&
                             texture.rgba_pixel_at(0, 0).green === 0 &&
                             texture.rgba_pixel_at(0, 0).blue === 0), "Creation of an RGB texture.");
        unit_tester.reject(()=>{texture.rgba_pixel_at(1, 0)}, "Reject accessing texture pixels out of bounds.");
        unit_tester.reject(()=>{Rngon.rgb_texture({width: 1, height: 1, pixels: [255, 0, 0, 255, 0, 0]})}, "Reject creating an RGB texture with invalid dimensions.");
        unit_tester.reject(()=>{Rngon.rgb_texture({width: 2, height: 1, pixels: [255, 0, 0]})}, "Reject creating an RGB texture with invalid dimensions.");
    });

    // The renderer.
    {
        // Create a test canvas we can render into.
        const testCanvasId = "test-canvas";
        const testCanvasWidth = 10;
        const testCanvasHeight = 10;
        k_assert((document.getElementById(testCanvasId) == null), "Expected the test canvas to not exist.");
        const canvas = document.createElement("canvas");
        canvas.setAttribute("id", testCanvasId);
        canvas.style.width = (testCanvasWidth + "px");
        canvas.style.height = (testCanvasHeight + "px");
        document.body.appendChild(canvas);
        k_assert((document.getElementById(testCanvasId) !== null), "Failed to create the test canvas.");
        
        unit_tester.test_unit("Render surface", function()
        {
            const renderSurface = Rngon.canvas(testCanvasId, Rngon.ngon_filler, Rngon.ngon_transformer, 1);
            unit_tester.require((renderSurface.width === testCanvasWidth &&
                                 renderSurface.height === testCanvasHeight), "Creation of a render surface.");
        });
        
        unit_tester.test_unit("Renderer", function()
        {
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
                    unit_tester.require((pixelMap.every((p)=>(p !== colorShade))), "Canvas is ready for testing.");
                }

                Rngon.render(testCanvasId, [mesh], Rngon.vector3(0, 0, 0), Rngon.vector3(0, 0, 0), 1);

                {
                    const pixelMap = canvas.getContext("2d").getImageData(0, 0, testCanvasWidth, testCanvasHeight).data;
                    unit_tester.require((pixelMap.every((p)=>(p === colorShade))), "Render output.");
                }
            }
        });

        canvas.remove();
    }
});
