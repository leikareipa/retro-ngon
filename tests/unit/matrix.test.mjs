/*
 * 2023 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 *
 */

import {Matrix} from "../../src/api/matrix.mjs";
import {good, bad, tr4} from "./utest2.mjs";

export default ()=>{
    // It's a 4 x 4 matrix, so constructor input should be 16 numbers.
    bad(
        ()=>Matrix(1, 1),
    );

    // Empty matrices should be default-initialized to identity.
    {
        const m = Matrix();
        good(
            ()=>m.data.length === 16,
            ()=>m.data[0]===1 && m.data[4]===0 && m.data[ 8]===0 && m.data[12]===0 &&
                m.data[1]===0 && m.data[5]===1 && m.data[ 9]===0 && m.data[13]===0 &&
                m.data[2]===0 && m.data[6]===0 && m.data[10]===1 && m.data[14]===0 &&
                m.data[3]===0 && m.data[7]===0 && m.data[11]===0 && m.data[15]===1,
        );
    }

    // Translation
    {
        const m = Matrix.translating(452.8541, 2.5412, 8745.1645);
        good(
            ()=>m.data.length === 16,
            ()=>tr4(m.data[0])===1.0000 && tr4(m.data[4])===0.0000 && tr4(m.data[ 8])===0.0000 && tr4(m.data[12])===452.8541  && 
                tr4(m.data[1])===0.0000 && tr4(m.data[5])===1.0000 && tr4(m.data[ 9])===0.0000 && tr4(m.data[13])===2.5412    && 
                tr4(m.data[2])===0.0000 && tr4(m.data[6])===0.0000 && tr4(m.data[10])===1.0000 && tr4(m.data[14])===8745.1645 && 
                tr4(m.data[3])===0.0000 && tr4(m.data[7])===0.0000 && tr4(m.data[11])===0.0000 && tr4(m.data[15])===1.0000,
        );
    }
}
