/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Mesh} from "../../src/api/mesh.mjs";
import {Vertex} from "../../src/api/vertex.mjs";
import {Vector} from "../../src/api/vector.mjs";
import {Color} from "../../src/api/color.mjs";
import {Ngon} from "../../src/api/ngon.mjs";
import {good} from "./utest2.mjs";

export default ()=>{
    const vertex = Vertex(1.1, 2.2, 3.3);

    const ngon = Ngon(
        [vertex], {
            color: Color(0, 111, 222),
            texture: null,
            hasWireframe: false,
    });
    
    const mesh = Mesh(
        [ngon], {
            translate: Vector(1, 2, 3),
            rotate: Vector(4, 5, 6),
            scale: Vector(7, 8, 9)
    });

    good(
        ()=>mesh.ngons.length === 1,
        ()=>mesh.translate.x === 1 && mesh.translate.y === 2 && mesh.translate.z === 3,
        ()=>mesh.rotate.x === 4 && mesh.rotate.y === 5 && mesh.rotate.z === 6,
        ()=>mesh.scale.x === 7 && mesh.scale.y === 8 && mesh.scale.z === 9,
    );

    // Mutability.
    mesh.rotate.x = 789456;
    mesh.translate.y = 456;
    mesh.scale.z = 123;
    good(
        ()=>mesh.rotate.x === 789456,
        ()=>mesh.translate.y === 456,
        ()=>mesh.scale.z === 123,
    );
}
