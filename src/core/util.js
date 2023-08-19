/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 * Various small utility functions and the like.
 *
 */

// Call this function using optional chaining - "assert?.()" - so it doesn't get
// invoked in production builds.
export const assert = IS_PRODUCTION_BUILD? undefined
: function(condition, errorMessage)
{
    if (!condition)
    { 
        throw new Error(errorMessage);
    }
}
