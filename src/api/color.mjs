/*
 * 2019 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";
import {Assert} from "../assert.mjs";

const schema = {
    arguments: {
        where: "in arguments to Rngon::color()",
        properties: {
            "red": ["number"],
            "green": ["number"],
            "blue": ["number"],
            "alpha": ["number"],
        },
    },
    interface: {
        where: "in the return value of Rngon::color()",
        properties: {
            "$constructor": {
                value: "Color",
            },
            "red": ["number"],
            "green": ["number"],
            "blue": ["number"],
            "alpha": ["number"],
            "unitRange": {
                subschema: {
                    "red": ["number"],
                    "green": ["number"],
                    "blue": ["number"],
                    "alpha": ["number"],
                }
            },
        },
    },
};

// Red, green, blue, alpha; in the range [0,255].
export function Color(
    red = 0,
    green = red,
    blue = red,
    alpha = 255
)
{
    validate_object?.({red, green, blue, alpha}, schema.arguments);

    Assert?.(
        (((red   >= 0) && (red   <= 255)) &&
         ((green >= 0) && (green <= 255)) &&
         ((blue  >= 0) && (blue  <= 255)) &&
         ((alpha >= 0) && (alpha <= 255))),
        "One or more of the given color values are out of range."
    );

    const publicInterface = {
        $constructor: "Color",
        red,
        green,
        blue,
        alpha,
        unitRange: {
            red: (red / 255),
            green: (green / 255),
            blue: (blue / 255),
            alpha: (alpha / 255),
        },
    };

    validate_object?.(publicInterface, schema.interface);
    
    return publicInterface;
}

// Note: We freeze these colors to prevent them from being accidentally modified
// via reference, e.g. after being assigned as the color of an n-gon's material.
// This doesn't freeze any sub-object properties, but should be enough to prevent
// most accidental modifications.
Color.aliceblue = Object.freeze(Color(240, 248, 255));
Color.antiquewhite = Object.freeze(Color(250, 235, 215));
Color.aqua = Object.freeze(Color(0, 255, 255));
Color.aquamarine = Object.freeze(Color(127, 255, 212));
Color.azure = Object.freeze(Color(240, 255, 255));
Color.beige = Object.freeze(Color(245, 245, 220));
Color.bisque = Object.freeze(Color(255, 228, 196));
Color.black = Object.freeze(Color(0, 0, 0));
Color.blanchedalmond = Object.freeze(Color(255, 235, 205));
Color.blue = Object.freeze(Color(0, 0, 255));
Color.blueviolet = Object.freeze(Color(138, 43, 226));
Color.brown = Object.freeze(Color(165, 42, 42));
Color.burlywood = Object.freeze(Color(222, 184, 135));
Color.cadetblue = Object.freeze(Color(95, 158, 160));
Color.chartreuse = Object.freeze(Color(127, 255, 0));
Color.chocolate = Object.freeze(Color(210, 105, 30));
Color.coral = Object.freeze(Color(255, 127, 80));
Color.cornflowerblue = Object.freeze(Color(100, 149, 237));
Color.cornsilk = Object.freeze(Color(255, 248, 220));
Color.crimson = Object.freeze(Color(220, 20, 60));
Color.cyan = Object.freeze(Color(0, 255, 255));
Color.darkblue = Object.freeze(Color(0, 0, 139));
Color.darkcyan = Object.freeze(Color(0, 139, 139));
Color.darkgoldenrod = Object.freeze(Color(184, 134, 11));
Color.darkgray = Object.freeze(Color(169, 169, 169));
Color.darkgreen = Object.freeze(Color(0, 100, 0));
Color.darkgrey = Object.freeze(Color(169, 169, 169));
Color.darkkhaki = Object.freeze(Color(189, 183, 107));
Color.darkmagenta = Object.freeze(Color(139, 0, 139));
Color.darkolivegreen = Object.freeze(Color(85, 107, 47));
Color.darkorange = Object.freeze(Color(255, 140, 0));
Color.darkorchid = Object.freeze(Color(153, 50, 204));
Color.darkred = Object.freeze(Color(139, 0, 0));
Color.darksalmon = Object.freeze(Color(233, 150, 122));
Color.darkseagreen = Object.freeze(Color(143, 188, 143));
Color.darkslateblue = Object.freeze(Color(72, 61, 139));
Color.darkslategray = Object.freeze(Color(47, 79, 79));
Color.darkslategrey = Object.freeze(Color(47, 79, 79));
Color.darkturquoise = Object.freeze(Color(0, 206, 209));
Color.darkviolet = Object.freeze(Color(148, 0, 211));
Color.deeppink = Object.freeze(Color(255, 20, 147));
Color.deepskyblue = Object.freeze(Color(0, 191, 255));
Color.dimgray = Object.freeze(Color(105, 105, 105));
Color.dimgrey = Object.freeze(Color(105, 105, 105));
Color.dodgerblue = Object.freeze(Color(30, 144, 255));
Color.firebrick = Object.freeze(Color(178, 34, 34));
Color.floralwhite = Object.freeze(Color(255, 250, 240));
Color.forestgreen = Object.freeze(Color(34, 139, 34));
Color.fuchsia = Object.freeze(Color(255, 0, 255));
Color.gainsboro = Object.freeze(Color(220, 220, 220));
Color.ghostwhite = Object.freeze(Color(248, 248, 255));
Color.gold = Object.freeze(Color(255, 215, 0));
Color.goldenrod = Object.freeze(Color(218, 165, 32));
Color.gray = Object.freeze(Color(128, 128, 128));
Color.green = Object.freeze(Color(0, 128, 0));
Color.greenyellow = Object.freeze(Color(173, 255, 47));
Color.grey = Object.freeze(Color(128, 128, 128));
Color.honeydew = Object.freeze(Color(240, 255, 240));
Color.hotpink = Object.freeze(Color(255, 105, 180));
Color.indianred = Object.freeze(Color(205, 92, 92));
Color.indigo = Object.freeze(Color(75, 0, 130));
Color.ivory = Object.freeze(Color(255, 255, 240));
Color.khaki = Object.freeze(Color(240, 230, 140));
Color.lavender = Object.freeze(Color(230, 230, 250));
Color.lavenderblush = Object.freeze(Color(255, 240, 245));
Color.lawngreen = Object.freeze(Color(124, 252, 0));
Color.lemonchiffon = Object.freeze(Color(255, 250, 205));
Color.lightblue = Object.freeze(Color(173, 216, 230));
Color.lightcoral = Object.freeze(Color(240, 128, 128));
Color.lightcyan = Object.freeze(Color(224, 255, 255));
Color.lightgoldenrodyellow = Object.freeze(Color(250, 250, 210));
Color.lightgray = Object.freeze(Color(211, 211, 211));
Color.lightgreen = Object.freeze(Color(144, 238, 144));
Color.lightgrey = Object.freeze(Color(211, 211, 211));
Color.lightpink = Object.freeze(Color(255, 182, 193));
Color.lightsalmon = Object.freeze(Color(255, 160, 122));
Color.lightseagreen = Object.freeze(Color(32, 178, 170));
Color.lightskyblue = Object.freeze(Color(135, 206, 250));
Color.lightslategray = Object.freeze(Color(119, 136, 153));
Color.lightslategrey = Object.freeze(Color(119, 136, 153));
Color.lightsteelblue = Object.freeze(Color(176, 196, 222));
Color.lightyellow = Object.freeze(Color(255, 255, 224));
Color.lime = Object.freeze(Color(0, 255, 0));
Color.limegreen = Object.freeze(Color(50, 205, 50));
Color.linen = Object.freeze(Color(250, 240, 230));
Color.magenta = Object.freeze(Color(255, 0, 255));
Color.maroon = Object.freeze(Color(128, 0, 0));
Color.mediumaquamarine = Object.freeze(Color(102, 205, 170));
Color.mediumblue = Object.freeze(Color(0, 0, 205));
Color.mediumorchid = Object.freeze(Color(186, 85, 211));
Color.mediumpurple = Object.freeze(Color(147, 112, 219));
Color.mediumseagreen = Object.freeze(Color(60, 179, 113));
Color.mediumslateblue = Object.freeze(Color(123, 104, 238));
Color.mediumspringgreen = Object.freeze(Color(0, 250, 154));
Color.mediumturquoise = Object.freeze(Color(72, 209, 204));
Color.mediumvioletred = Object.freeze(Color(199, 21, 133));
Color.midnightblue = Object.freeze(Color(25, 25, 112));
Color.mintcream = Object.freeze(Color(245, 255, 250));
Color.mistyrose = Object.freeze(Color(255, 228, 225));
Color.moccasin = Object.freeze(Color(255, 228, 181));
Color.navajowhite = Object.freeze(Color(255, 222, 173));
Color.navy = Object.freeze(Color(0, 0, 128));
Color.oldlace = Object.freeze(Color(253, 245, 230));
Color.olive = Object.freeze(Color(128, 128, 0));
Color.olivedrab = Object.freeze(Color(107, 142, 35));
Color.orange = Object.freeze(Color(255, 165, 0));
Color.orangered = Object.freeze(Color(255, 69, 0));
Color.orchid = Object.freeze(Color(218, 112, 214));
Color.palegoldenrod = Object.freeze(Color(238, 232, 170));
Color.palegreen = Object.freeze(Color(152, 251, 152));
Color.paleturquoise = Object.freeze(Color(175, 238, 238));
Color.palevioletred = Object.freeze(Color(219, 112, 147));
Color.papayawhip = Object.freeze(Color(255, 239, 213));
Color.peachpuff = Object.freeze(Color(255, 218, 185));
Color.peru = Object.freeze(Color(205, 133, 63));
Color.pink = Object.freeze(Color(255, 192, 203));
Color.plum = Object.freeze(Color(221, 160, 221));
Color.powderblue = Object.freeze(Color(176, 224, 230));
Color.purple = Object.freeze(Color(128, 0, 128));
Color.red = Object.freeze(Color(255, 0, 0));
Color.rosybrown = Object.freeze(Color(188, 143, 143));
Color.royalblue = Object.freeze(Color(65, 105, 225));
Color.saddlebrown = Object.freeze(Color(139, 69, 19));
Color.salmon = Object.freeze(Color(250, 128, 114));
Color.sandybrown = Object.freeze(Color(244, 164, 96));
Color.seagreen = Object.freeze(Color(46, 139, 87));
Color.seashell = Object.freeze(Color(255, 245, 238));
Color.sienna = Object.freeze(Color(160, 82, 45));
Color.silver = Object.freeze(Color(192, 192, 192));
Color.skyblue = Object.freeze(Color(135, 206, 235));
Color.slateblue = Object.freeze(Color(106, 90, 205));
Color.slategray = Object.freeze(Color(112, 128, 144));
Color.slategrey = Object.freeze(Color(112, 128, 144));
Color.snow = Object.freeze(Color(255, 250, 250));
Color.springgreen = Object.freeze(Color(0, 255, 127));
Color.steelblue = Object.freeze(Color(70, 130, 180));
Color.tan = Object.freeze(Color(210, 180, 140));
Color.teal = Object.freeze(Color(0, 128, 128));
Color.thistle = Object.freeze(Color(216, 191, 216));
Color.tomato = Object.freeze(Color(255, 99, 71));
Color.transparent = Object.freeze(Color(0, 0, 0, 0));
Color.turquoise = Object.freeze(Color(64, 224, 208));
Color.violet = Object.freeze(Color(238, 130, 238));
Color.wheat = Object.freeze(Color(245, 222, 179));
Color.white = Object.freeze(Color(255, 255, 255));
Color.whitesmoke = Object.freeze(Color(245, 245, 245));
Color.yellow = Object.freeze(Color(255, 255, 0));
Color.yellowgreen = Object.freeze(Color(154, 205, 50));
