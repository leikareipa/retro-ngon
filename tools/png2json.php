<?php
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * PNG2JSON for the retro n-gon renderer
 *
 * Converts a given PNG image into a JSON that contains the image's RGBA pixel data in
 * Base64-encoded 16-bit (RGBA 5551) values. Is not heavily tested as of yet.
 * 
 * Command-line options:
 *  -i <string>    Name and path of the input PNG file.
 *  -o <string>    Name and path of the output JSON file.
 *  -r             Save pixel data in raw RGBA-8888 format, rather than in 16-bit
 *                 packed RGBA-5551.
 *  -t <r,g,b>     A color to be output as transparent. For instance, purple pixels
 *                 in the image can be made transparent with "-t 255,0,255".
 *                             
 */

$commandLine = getopt("i:o:t:r");
{
    $save_raw_pixel_data = isset($commandLine["r"]);

    if (!isset($commandLine["i"]))
    {
        printf("ERROR: No input file specified.\n");
        exit(1);
    }

    if (!isset($commandLine["o"]))
    {
        $commandLine["o"] = (pathinfo($commandLine["i"], PATHINFO_BASENAME) . ".rngon-texture.json");
    }

    if (isset($commandLine["t"]))
    {
        $transparentColor = array_values(explode(",", $commandLine["t"]));
    }
    else
    {
        $transparentColor = [-1, -1, -1];
    }
}

$outfile = fopen($commandLine["o"], "w");
if (!$outfile)
{
    printf("ERROR: Can't open the output file for writing.\n");
    exit(1);
}

$img = imagecreatefrompng($commandLine["i"]);
if (!$img)
{
    printf("ERROR: Can't create a PHP image object out of the input PNG.\n");
    exit(1);
}

$width = imagesx($img);
$height = imagesy($img);
if (!$width || !$height)
{
    printf("ERROR: Can't determine the PNG's resolution.\n");
    exit(1);
}

// Convert the image's RGBA pixel data into a string.
$data = "";
for ($y = 0; $y < $height; $y++)
{
    for ($x = 0; $x < $width; $x++)
    {
        $color = imagecolorsforindex($img, imagecolorat($img, $x, $y));

        // Either fully opaque (1) or fully transparent (0).
        if (($transparentColor[0] == $color["red"]) &&
            ($transparentColor[1] == $color["green"]) &&
            ($transparentColor[2] == $color["blue"]))
        {
            $alpha = 0;
        }
        else
        {
            // Note that in PHP GD, fully opaque is 0 and fully transparent is 127.
            $alpha = !$color["alpha"];
        }

        if ($save_raw_pixel_data)
        {
            // Pack the pixel into 32 bits (8888).
            $data .= pack("V", (
                 $color["red"]          |
                ($color["green"] << 8)  |
                ($color["blue"]  << 16) |
                (($alpha * 255)  << 24)
            ));
        }
        else
        {
            // Pack the pixel into 16 bits (5551).
            $data .= pack("v", (
                 (int)($color["red"]   / 8)        |
                ((int)($color["green"] / 8) << 5)  |
                ((int)($color["blue"]  / 8) << 10) |
                ((bool)($alpha         & 1) << 15)
             ));
        }
    }
}

fprintf($outfile, "{\n");
fprintf($outfile, "\t\"what\":\"A texture for the retro n-gon renderer\",\n");
fprintf($outfile, "\t\"source\":\"%s\",\n", pathinfo($commandLine["i"], PATHINFO_BASENAME));
fprintf($outfile, "\t\"width\":%d,\n", $width);
fprintf($outfile, "\t\"height\":%d,\n", $height);
if ($save_raw_pixel_data)
{
    fprintf($outfile, "\t\"channels\":\"rgba:8+8+8+8\",\n");
}
else
{
    fprintf($outfile, "\t\"channels\":\"rgba:5+5+5+1\",\n");
}
fprintf($outfile, "\t\"encoding\":\"base64\",\n");
fprintf($outfile, "\t\"pixels\":\"%s\"", base64_encode($data));
fprintf($outfile, "\n}");
?>
