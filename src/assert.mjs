/*
 * 2019-2023 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 *
 */

// Call this function using optional chaining - "assert?.()" - so it doesn't get
// invoked in production builds.
export const Assert = ((typeof window === "object") && IS_PRODUCTION_BUILD)? undefined
: function(condition, errorMessage)
{
    if (!condition)
    { 
        throw new Error(errorMessage);
    }
}
