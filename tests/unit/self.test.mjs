/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {good, bad, tr4} from "./utest2.mjs";

export default ()=>{
    good(
        ()=>(1 + 1) === 2,
        ()=>tr4(14568.787566) === 14568.7875,
        ()=>tr4(-14568.787566) === -14568.7875,
        ()=>tr4(0.00001) === 0,
        ()=>tr4(0.00007) === 0,
    );

    bad(
        ()=>{const i = 0; i = 1;},
    );
}
