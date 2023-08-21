/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Matrix} from "../../src/core/matrix.mjs";
import {good, tr4} from "./utest2.mjs";

export default ()=>{
    // Matrix.translation
    {
        const m = Matrix.translation(452.8541, 2.5412, 8745.1645);
        good(
            ()=>m.length === 16,
            ()=>tr4(m[0])===1.0000 && tr4(m[4])===0.0000 && tr4(m[ 8])===0.0000 && tr4(m[12])===452.8541  && 
                tr4(m[1])===0.0000 && tr4(m[5])===1.0000 && tr4(m[ 9])===0.0000 && tr4(m[13])===2.5412    && 
                tr4(m[2])===0.0000 && tr4(m[6])===0.0000 && tr4(m[10])===1.0000 && tr4(m[14])===8745.1645 && 
                tr4(m[3])===0.0000 && tr4(m[7])===0.0000 && tr4(m[11])===0.0000 && tr4(m[15])===1.0000,
        );
    }

    // Matrix.perspective
    {
        const m = Matrix.perspective(0.7545, 1.7155, 0.9138, 97852.8647);
        good(
            ()=>m.length === 16,
            ()=>tr4(m[0])===1.4711 && tr4(m[4])===0.0000 && tr4(m[ 8])===0.0000 && tr4(m[12])===0.0000  && 
                tr4(m[1])===0.0000 && tr4(m[5])===2.5238 && tr4(m[ 9])===0.0000 && tr4(m[13])===0.0000  && 
                tr4(m[2])===0.0000 && tr4(m[6])===0.0000 && tr4(m[10])===1.0000 && tr4(m[14])===-1.8276 && 
                tr4(m[3])===0.0000 && tr4(m[7])===0.0000 && tr4(m[11])===1.0000 && tr4(m[15])===0.0000,
        );
    }

    // Matrix.ortho
    {
        const m = Matrix.ortho(4567.2434, 3.1284);
        good(
            ()=>m.length === 16,
            ()=>tr4(m[0])===2283.6217 && tr4(m[4])===0.0000  && tr4(m[ 8])===0.0000 && tr4(m[12])===2283.1217 && 
                tr4(m[1])===0.0000    && tr4(m[5])===-1.5642 && tr4(m[ 9])===0.0000 && tr4(m[13])===1.0642    && 
                tr4(m[2])===0.0000    && tr4(m[6])===0.0000  && tr4(m[10])===1.0000 && tr4(m[14])===0.0000    && 
                tr4(m[3])===0.0000    && tr4(m[7])===0.0000  && tr4(m[11])===0.0000 && tr4(m[15])===1.0000,
        );
    }

    // Matrix.multiply
    {
        const m = Matrix.multiply(
            Matrix.translation(452.8541, 2.5412, 8745.1645),
            Matrix.perspective(0.7545, 1.7155, 0.9138, 97852.8647)
        );
        good(
            ()=>m.length === 16,
            ()=>tr4(m[0])===1.4711 && tr4(m[4])===0.0000 && tr4(m[ 8])===452.8541  && tr4(m[12])===0.0000  && 
                tr4(m[1])===0.0000 && tr4(m[5])===2.5238 && tr4(m[ 9])===2.5412    && tr4(m[13])===0.0000  && 
                tr4(m[2])===0.0000 && tr4(m[6])===0.0000 && tr4(m[10])===8746.1645 && tr4(m[14])===-1.8276 && 
                tr4(m[3])===0.0000 && tr4(m[7])===0.0000 && tr4(m[11])===1.0000    && tr4(m[15])===0.0000,
        );

        /// TODO: Verify that the input matrices aren't modified.
    }
}