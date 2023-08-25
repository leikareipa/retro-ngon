/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {
    Matrix,
    matrix_perspective,
    matrix_ortho,
    matrix_multiply,
} from "../../src/api/matrix.mjs";
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
        const m = Matrix.translation(452.8541, 2.5412, 8745.1645);
        good(
            ()=>m.data.length === 16,
            ()=>tr4(m.data[0])===1.0000 && tr4(m.data[4])===0.0000 && tr4(m.data[ 8])===0.0000 && tr4(m.data[12])===452.8541  && 
                tr4(m.data[1])===0.0000 && tr4(m.data[5])===1.0000 && tr4(m.data[ 9])===0.0000 && tr4(m.data[13])===2.5412    && 
                tr4(m.data[2])===0.0000 && tr4(m.data[6])===0.0000 && tr4(m.data[10])===1.0000 && tr4(m.data[14])===8745.1645 && 
                tr4(m.data[3])===0.0000 && tr4(m.data[7])===0.0000 && tr4(m.data[11])===0.0000 && tr4(m.data[15])===1.0000,
        );
    }

    // Perspective
    {
        const m = matrix_perspective(0.7545, 1.7155, 0.9138, 97852.8647);
        good(
            ()=>m.data.length === 16,
            ()=>tr4(m.data[0])===1.4711 && tr4(m.data[4])===0.0000 && tr4(m.data[ 8])===0.0000 && tr4(m.data[12])===0.0000  && 
                tr4(m.data[1])===0.0000 && tr4(m.data[5])===2.5238 && tr4(m.data[ 9])===0.0000 && tr4(m.data[13])===0.0000  && 
                tr4(m.data[2])===0.0000 && tr4(m.data[6])===0.0000 && tr4(m.data[10])===1.0000 && tr4(m.data[14])===-1.8276 && 
                tr4(m.data[3])===0.0000 && tr4(m.data[7])===0.0000 && tr4(m.data[11])===1.0000 && tr4(m.data[15])===0.0000,
        );
    }

    // Ortho
    {
        const m = matrix_ortho(4567.2434, 3.1284);
        good(
            ()=>m.data.length === 16,
            ()=>tr4(m.data[0])===2283.6217 && tr4(m.data[4])===0.0000  && tr4(m.data[ 8])===0.0000 && tr4(m.data[12])===2283.1217 && 
                tr4(m.data[1])===0.0000    && tr4(m.data[5])===-1.5642 && tr4(m.data[ 9])===0.0000 && tr4(m.data[13])===1.0642    && 
                tr4(m.data[2])===0.0000    && tr4(m.data[6])===0.0000  && tr4(m.data[10])===1.0000 && tr4(m.data[14])===0.0000    && 
                tr4(m.data[3])===0.0000    && tr4(m.data[7])===0.0000  && tr4(m.data[11])===0.0000 && tr4(m.data[15])===1.0000,
        );
    }

    // Multiply
    {
        const m = matrix_multiply(
            Matrix.translation(452.8541, 2.5412, 8745.1645),
            matrix_perspective(0.7545, 1.7155, 0.9138, 97852.8647)
        );
        good(
            ()=>m.data.length === 16,
            ()=>tr4(m.data[0])===1.4711 && tr4(m.data[4])===0.0000 && tr4(m.data[ 8])===452.8541  && tr4(m.data[12])===0.0000  && 
                tr4(m.data[1])===0.0000 && tr4(m.data[5])===2.5238 && tr4(m.data[ 9])===2.5412    && tr4(m.data[13])===0.0000  && 
                tr4(m.data[2])===0.0000 && tr4(m.data[6])===0.0000 && tr4(m.data[10])===8746.1645 && tr4(m.data[14])===-1.8276 && 
                tr4(m.data[3])===0.0000 && tr4(m.data[7])===0.0000 && tr4(m.data[11])===1.0000    && tr4(m.data[15])===0.0000,
        );

        /// TODO: Verify that the input matrices aren't modified.
    }
}
