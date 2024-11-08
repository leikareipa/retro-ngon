/*
 * 2023 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Vector} from "../../src/api/vector.mjs";
import {good, tr4} from "./utest2.mjs";

export default ()=>{
    const vector = Vector(1.1, 2.2, 3.3);

    good(
        ()=>tr4(vector.x) === 1.1,
        ()=>tr4(vector.y) === 2.2,
        ()=>tr4(vector.z) === 3.3,
    );

    // Mutability.
    vector.x = vector.y = vector.z = 4;
    good(
        ()=>vector.x === 4,
        ()=>vector.y === 4,
        ()=>vector.z === 4,
    );
}
