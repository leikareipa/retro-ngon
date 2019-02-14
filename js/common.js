"use strict";

function k_assert(condition = false, explanation = "(no reason given)")
{
    if (!condition)
    {
        alert(explanation);
        throw Error(explanation);
    }
}

function k_lerp(x, y, interval)
{
    return (x + (interval * (y - x)));
}
