<?php
/*
 * Tarpeeksi Hyvae Soft 2019 /
 * PNG2JSON for the retro n-gon renderer
 *
 * Converts a given PNG image into a JSON that contains the image's RGBA pixel data in
 * Base64-encoded 16-bit (RGBA 5551) values. Is not heavily tested as of yet.
 * 
 * Command-line options:
 *  -i <string> = name and path of the input PNG file.
 *  -o <string> = name and path of the output JSON file.
 *  -r = save pixel data in raw RGBA-8888 format, rather than in 16-bit packed RGBA-5551.
 */

$commandLine = getopt("i:o:r");
{
    $save_raw_pixel_data = isset($commandLine["r"]);

    if (!isset($commandLine["i"]))
    {
        printf("ERROR: No input file specified.\n");
        die;
    }

    if (!isset($commandLine["o"]))
    {
        $commandLine["o"] = (pathinfo($commandLine["i"], PATHINFO_BASENAME) . ".rngon-texture.json");
    }
}

$outfile = fopen($commandLine["o"], "w");
if (!$outfile)
{
    printf("ERROR: Can't open the output file for writing.\n");
    die;
}

$img = imagecreatefrompng($commandLine["i"]);
if (!$img)
{
    printf("ERROR: Can't create a PHP image object out of the input PNG.\n");
    die;
}

$width = imagesx($img);
$height = imagesy($img);
if (!$width || !$height)
{
    printf("ERROR: Can't determine the PNG's resolution.\n");
    die;
}

// Convert the image's RGBA pixel data into a string.
$data = "";
for ($y = 0; $y < $height; $y++)
{
    for ($x = 0; $x < $width; $x++)
    {
        $color = imagecolorsforindex($img, imagecolorat($img, $x, $y));

        // Either fully opaque (1) or fully transparent (0). (Note that in PHP GD, fully opaque is 0 and fully transparent is 127.)
        $alpha = !$color["alpha"];

        if ($save_raw_pixel_data)
        {
            $data .= ($color["red"] . "," . $color["green"] . "," . $color["blue"] . "," . ($alpha*255));

            // Break the line every couple of pixels.
            if (($y*$width+$x+1)%5==0) $data .= ",\n\t";
            else $data .= ", ";
        }
        else
        {
            // Pack the pixel's RGBA into a 16-bit value of the format 5551.
            $packed =  (int)($color["red"]   / 8)        |
                      ((int)($color["green"] / 8) << 5)  |
                      ((int)($color["blue"]  / 8) << 10) |
                     ((bool)($alpha          & 1) << 15);

            $data .= pack("v", $packed);
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
    fprintf($outfile, "\t\"encoding\":\"none\",\n");
    fprintf($outfile, "\t\"pixels\":[\n\t%s\n\t]", rtrim(rtrim($data, ", "), ", \n\t"));
}
else
{
    fprintf($outfile, "\t\"channels\":\"rgba:5+5+5+1\",\n");
    fprintf($outfile, "\t\"encoding\":\"base64\",\n");
    fprintf($outfile, "\t\"pixels\":\"%s\"", base64_encode($data));
}
fprintf($outfile, "\n}");
?>
