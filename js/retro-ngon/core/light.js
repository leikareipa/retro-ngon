/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

// A light source. This is a work-in-progress implementation.
export function light(
    position = Rngon.vector3(0, 0, 0),
    settings = {}
)
{
    light.defaultSettings = (
        light.defaultSettings ||
        {
            intensity: 100,
        
            // The maximum shade value that this light can generate. A value of 1 means
            // that a surface fully lit by this light displays its base color (or base
            // texel) and never a color brighter than that. A value higher than one will
            // boost the base color of a fully lit surface by that multiple.
            clip: 1,
        
            // How strongly the light's intensity attenuates with distance from the light
            // source. Values lower than 1 cause the light to attenuate less over a distance;
            // while values above 1 cause the light to attenuate more over a distance.
            attenuation: 1,
        }        
    );

    const publicInterface = {
        position,
        ...light.defaultSettings,
        ...settings,
    };

    return publicInterface;
}
