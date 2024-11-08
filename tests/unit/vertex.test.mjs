/*
 * 2023 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Vertex} from "../../src/api/vertex.mjs";
import {good, tr4} from "./utest2.mjs";

export default ()=>{
    const vertex = Vertex(1.1, 2.2, 3.3);

    good(
        ()=>tr4(vertex.x) === 1.1,
        ()=>tr4(vertex.y) === 2.2,
        ()=>tr4(vertex.z) === 3.3,
    );

    // Mutability.
    vertex.x = vertex.y = vertex.z = 4;
    good(
        ()=>vertex.x === 4,
        ()=>vertex.y === 4,
        ()=>vertex.z === 4,
    );
}
