<?php
/*
 * 2019-2024 Tarpeeksi Hyvae Soft
 * 
 * Software: PNG2JSON for the retro n-gon renderer
 *
 * Converts a given PNG image into a JSON that contains the image's RGBA pixel data in
 * Base64-encoded 16-bit (RGBA 5551) values. Is not heavily tested as of yet.
 * 
 * Command-line options:
 *  -i <string>    Name and path of the input PNG file.
 *  -o <string>    Name and path of the output JSON file.
 *  -r             Save pixel data in RGBA-8888 format.
 *  -b             Save pixel data in binary format (1 bit per pixel).
 *  -a             Output as an array.
 *  -t <r,g,b>     A color to be output as transparent. For instance, purple pixels
 *                 in the image can be made transparent with "-t 255,0,255".          
 */

$commandLine = getopt("i:o:t:c:rab");
{
    $saveAsArray = isset($commandLine["a"]);

    $colorFormat = $commandLine["c"];
    if (!in_array($colorFormat, array("rgba:8+8+8+1", "rgba:5+5+5+1", "binary")))
    {
        printf("ERROR: Unsupported color format \"%s\".\n", $colorFormat);
        exit(1);
    }

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

$outFile = fopen($commandLine["o"], "w");
if (!$outFile)
{
    printf("ERROR: Can't open the output file for writing.\n");
    exit(1);
}

$sourceImage = imagecreatefrompng($commandLine["i"]);
if (!$sourceImage)
{
    printf("ERROR: Can't create a PHP image object out of the input PNG.\n");
    exit(1);
}

$width = imagesx($sourceImage);
$height = imagesy($sourceImage);
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
        $color = imagecolorsforindex($sourceImage, imagecolorat($sourceImage, $x, $y));

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

        switch ($colorFormat)
        {
            case "rgba:8+8+8+8":
            {
                if ($saveAsArray)
                {
                    $data .= ($color["red"] . "," . $color["green"] . "," . $color["blue"] . "," . ($alpha*255) . ",");
                }
                else
                {
                    $data .= pack("V", (
                         $color["red"]          |
                        ($color["green"] << 8)  |
                        ($color["blue"]  << 16) |
                        (($alpha * 255)  << 24)
                    ));
                }

                break;
            }
            case "rgba:5+5+5+1":
            {
                $color = (
                     (int)($color["red"]   / 8)        |
                    ((int)($color["green"] / 8) << 5)  |
                    ((int)($color["blue"]  / 8) << 10) |
                    ((bool)($alpha         & 1) << 15)
                );
                    
                $data .= ($saveAsArray? ($color . ",") : pack("v", $color));

                break;
            }
            case "binary":
            {
                $color = (($color["red"] || $color["green"] || $color["blue"]) & 1);
                $data .= ($saveAsArray? ($color . ",") : pack("C", $color));

                break;
            }
        }
    }
}

fprintf($outFile, "{\n");
fprintf($outFile, "\t\"width\":%d,\n", $width);
fprintf($outFile, "\t\"height\":%d,\n", $height);
fprintf($outFile, "\t\"channels\":\"%s\",\n", $colorFormat);
if ($saveAsArray)
{
    fprintf($outFile, "\t\"encoding\":\"none\",\n");
    fprintf($outFile, "\t\"pixels\":[%s]", rtrim(rtrim($data, ", "), ", \n\t"));
}
else
{
    fprintf($outFile, "\t\"encoding\":\"base64\",\n");
    fprintf($outFile, "\t\"pixels\":\"%s\"", base64_encode($data));
}
fprintf($outFile, "\n}");
?>
