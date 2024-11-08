/*
 * 2023 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Vertex} from "../../src/api/vertex.mjs";
import {Color} from "../../src/api/color.mjs";
import {Ngon} from "../../src/api/ngon.mjs";
import {Default} from "../../src/api/default.mjs";
import {good} from "./utest2.mjs";

export default ()=>{

    const vertex = Vertex(1.1, 2.2, 3.3);

    // With custom material.
    {
        const ngon = Ngon(
            [vertex], {
                color: Color(0, 111, 222),
                texture: null,
                hasWireframe: false,
        });
        good(
            ()=>ngon.vertices.length === 1,
            ()=>ngon.vertices[0] === vertex,
            ()=>ngon.material.color.red === 0,
            ()=>ngon.material.color.green === 111,
            ()=>ngon.material.color.blue === 222,
            ()=>ngon.material.texture === null,
            ()=>ngon.material.hasWireframe === false,
        );

        // Mutability.
        ngon.material.texture = 123456;
        ngon.vertices[0].x = 456789;
        good(
            ()=>ngon.vertices[0].x === 456789,
            ()=>ngon.material.texture === 123456,
        );
    }

    // With default material.
    {
        const ngon = Ngon([vertex]);
        good(
            ()=>Object.keys(Default.ngon.material).length === Object.keys(ngon.material).length,
            ()=>Object.keys(Default.ngon.material).every(k=>Default.ngon.material[k] === ngon.material[k]),
        );

        // Mutability.
        ngon.material.texture = 123456;
        ngon.vertices[0].x = 456789;
        good(
            ()=>ngon.vertices[0].x === 456789,
            ()=>ngon.material.texture === 123456,
        );
    }
}
