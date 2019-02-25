#
# Tarpeeksi Hyvae Soft 2019 /
# Retro n-gon renderer
#
# A barebones Blender export script for the retro n-gon renderer. Only lightly tested,
# as of now, so is likely to contain bugs and pitfalls. Made for Blender 2.76, but may
# also work with other versions.
# 
# Future versions of the script will integrate it into Blender's export menu, for more
# convenient usage.
#
# Notes:
#   - in Blender, apply all transformations before exporting, or they may be ignored
#   - material properties other than diffuse color/intensity and the first texture slot are ignored
#   - the filename, if any, of a material's first texture slot will be exported and used in rendering
#       - before rendering, texture images must be converted into the renderer's format (e.g. PNG2JSON)
#       - only PNG images are supported, at this time
#       - the images can be of any (reasonable) resolution; non-power-of-two is supported
#   - UV coordinates are not exported (nor needed by the renderer)
#   - if need be, modify the export filename ('outFilename') by hand to get it the way you want it
#   - the exported file will have a default model name ('modelName'); adjust it by hand if need be
# 

import bpy
from bpy import context

outFilename = "model.rngon-model.js"
modelName = "model"

materials = bpy.data.materials
textures = bpy.data.textures
with open(outFilename, 'w') as f:
    f.write("\"use strict\";\n\n")
    f.write("// A 3d model exported from Blender via the retro n-gon renderer's exporter.\n");
    f.write("//\n");
    f.write("// Usage:\n");
    f.write("//    - call .initialize(), which populates the .ngons array\n");
    f.write("//    - now you can access the n-gons via .ngons\n");
    f.write("//    - if you need .initialize() to finish before you start rendering, call it with await inside an async()=>{} wrapper\n");

    f.write("const %s =\n{\n" % modelName);
    f.write("\tngons:[],\n");
    f.write("\tinitialize: async function()\n\t{\n");

    f.write("\t\t// Shorthands, for a smaller file size.\n")
    f.write("\t\tconst n = Rngon.ngon;\n")
    f.write("\t\tconst v = Rngon.vertex4;\n")
    f.write("\t\tconst c = Rngon.color_rgba;\n")
    f.write("\t\tconst ct = Rngon.texture_rgba.create_with_data_from_file;\n\n");

    # Write the textures.
    f.write("\t\t// Load the textures.\n")
    f.write("\t\tconst t = {\n");
    for tex in textures:
        if hasattr(tex, "image"):
            f.write("\t\t\t\"%s\":await ct(\"%s.rngon-texture.json\"),\n" % (tex.image.name, tex.image.name))
    f.write("\t\t};\n\n")
    
    # Write the materials.
    f.write("\t\t// Set up the materials.\n")
    f.write("\t\tconst m = {\n");
    for mat in materials:
        color = list(map(lambda x: x*255*mat.diffuse_intensity, mat.diffuse_color))
        texture = mat.texture_slots[0] # The exporter ignores all but the first texture slot.
        f.write("\t\t\t\"%s\":{" % mat.name)
        f.write("color:c(%d,%d,%d)," % (color[0], color[1], color[2]))
        if texture and hasattr(texture.texture, "image"):
            f.write("texture:t[\"%s\"]," % texture.texture.image.name)
        f.write("},\n")
    f.write("\t\t};\n\n")
    
    # Write the n-gons.
    f.write("\t\t// N-gons.\n")
    f.write("\t\tthis.ngons = Object.freeze(\n\t\t[\n")
    visible_meshes = filter(lambda x: x.type == "MESH", context.visible_objects)
    for mesh in visible_meshes:
        f.write("\t\t\t// Parent mesh: %s.\n" % mesh.name)
        for poly in mesh.data.polygons:
            f.write("\t\t\tn([")
            for v in poly.vertices:
                vd = mesh.data.vertices[v].co * mesh.matrix_world
                f.write("v(%.4f,%.4f,%.4f)," % vd[:])
            f.write("]")
            material = mesh.material_slots[poly.material_index].material
            if material != None:
                f.write(",m[\"%s\"]" % material.name)
            f.write("),\n")
            
    # Finalize the file.
    f.write("\t\t]);\n\t}\n};")
