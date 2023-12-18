/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

function create_cube(gl)
{
    console.assert(gl.GetString(gl.VERSION) === "1.1");

    gl.Scalef(40, 40, 40);
    gl.Rotatef(0, this.cubeRotation, this.cubeRotation);

    if (this.woodTexture.$isEnabled) {
        gl.BindTexture(gl.TEXTURE_2D, this.woodTexture);
    }

    // Back.
    gl.Color3ub(64, 192, 192);
    gl.Begin(gl.POLYGON);
        gl.TexCoord2f(0, 0);
        gl.Vertex3f(-0.5, -0.5, 0.5);
        gl.TexCoord2f(1, 0);
        gl.Vertex3f(0.5, -0.5, 0.5);
        gl.TexCoord2f(1, 1);
        gl.Vertex3f(0.5, 0.5, 0.5);
        gl.TexCoord2f(0, 1);
        gl.Vertex3f(-0.5, 0.5, 0.5);
    gl.End();

    // Front.
    gl.Color3ub(255, 0, 192, 128);
    gl.Begin(gl.POLYGON);
        gl.TexCoord2f(0, 0);
        gl.Vertex3f(-0.5, -0.5, -0.5);
        gl.TexCoord2f(1, 0);
        gl.Vertex3f(0.5, -0.5, -0.5);
        gl.TexCoord2f(1, 1);
        gl.Vertex3f(0.5, 0.5, -0.5);
        gl.TexCoord2f(0, 1);
        gl.Vertex3f(-0.5, 0.5, -0.5);
    gl.End();

    // Left.
    gl.Color3ub(0, 255, 64);
    gl.Begin(gl.POLYGON);
        gl.TexCoord2f(0, 1);
        gl.Vertex3f(-0.5, -0.5, 0.5);
        gl.TexCoord2f(0, 0);
        gl.Vertex3f(-0.5, -0.5, -0.5);
        gl.TexCoord2f(1, 0);
        gl.Vertex3f(-0.5, 0.5, -0.5);
        gl.TexCoord2f(1, 1);
        gl.Vertex3f(-0.5, 0.5, 0.5);
    gl.End();

    // Right.
    gl.Color3ub(255, 255, 0);
    gl.Begin(gl.POLYGON);
        gl.TexCoord2f(0, 1);
        gl.Vertex3f(0.5, -0.5, 0.5);
        gl.TexCoord2f(0, 0);
        gl.Vertex3f(0.5, -0.5, -0.5);
        gl.TexCoord2f(1, 0);
        gl.Vertex3f(0.5, 0.5, -0.5);
        gl.TexCoord2f(1, 1);
        gl.Vertex3f(0.5, 0.5, 0.5);
    gl.End();

    // Top.
    gl.Color3ub(0, 64, 255);
    gl.Begin(gl.POLYGON);
        gl.TexCoord2f(0, 0);
        gl.Vertex3f(-0.5, -0.5, -0.5);
        gl.TexCoord2f(1, 0);
        gl.Vertex3f(0.5, -0.5, -0.5);
        gl.TexCoord2f(1, 1);
        gl.Vertex3f(0.5, -0.5, 0.5);
        gl.TexCoord2f(0, 1);
        gl.Vertex3f(-0.5, -0.5, 0.5);
    gl.End();

    // Bottom.
    gl.Color3ub(0, 0, 0);
    gl.Begin(gl.POLYGON);
        gl.TexCoord2f(0, 0);
        gl.Vertex3f(-0.5, 0.5, -0.5);
        gl.TexCoord2f(1, 0);
        gl.Vertex3f(0.5, 0.5, -0.5);
        gl.TexCoord2f(1, 1);
        gl.Vertex3f(0.5, 0.5, 0.5);
        gl.TexCoord2f(0, 1);
        gl.Vertex3f(-0.5, 0.5, 0.5);
    gl.End();
}

// Supports OpenGL 1.1 API functionality (omitting the gl/GL_ prefix).
const OPENGL_1_1 = (()=>{
    return {
        TRIANGLES: 1,
        
        POLYGON: 2,
        TEXTURE_2D: 1,

        VENDOR: 1,
        VERSION: 2,
        RENDERER: 3,

        Begin,

        End,

        GetString,

        Color3ub,

        BindTexture,

        Vertex2f,
        Vertex2d: Vertex2f,
        Vertex2i: Vertex2f,
        Vertex2s: Vertex2f,

        Vertex3f,
        Vertex3d: Vertex3f,
        Vertex3i: Vertex3f,
        Vertex3s: Vertex3f,

        Vertex4f,
        Vertex4d: Vertex4f,
        Vertex4i: Vertex4f,
        Vertex4s: Vertex4f,

        TexCoord2f,
        TexCoord2d: TexCoord2f,
        TexCoord2i: TexCoord2f,
        TexCoord2s: TexCoord2f,

        Translatef,
        Translated: Translatef,

        Scalef,
        Scaled: Scalef,

        Rotatef,
        Rotated: Rotatef,
    };

    function GetString(name) {
        switch (name) {
            case this.VERSION: return "1.1";
            case this.VENDOR: return "Tarpeeksi Hyvae Soft";
            case this.RENDERER: return "The retro n-gon renderer";
            default: return "";
        };
    }
    
    function Begin(mode) {
        this.mesh.push(Rngon.ngon([], {
            color: this.color,
            texture: this.texture,
            textureMapping: "affine",
        }));
    }
    
    function End() {
        const ngon = this.mesh.at(-1);
        
        if (ngon.vertices.length !== ngon.vertexNormals.length)
        {
            ngon.vertexNormals = new Array(ngon.vertices.length).fill().map(n=>structuredClone(ngon.normal));
        }
    }
    
    function Color3ub(r, g, b) {
        this.color = Rngon.color(r, g, b);
    }

    function TexCoord2f(u, v) {
        this.u = u;
        this.v = v;
    }

    function Vertex2f(x, y) {
        this.mesh.at(-1).vertices.push(Rngon.vertex(x, y, 0, this.u, this.v));
    }
    
    function Vertex3f(x, y, z) {
        this.mesh.at(-1).vertices.push(Rngon.vertex(x, y, z, this.u, this.v));
    }
    
    function Vertex4f(x, y, z, w) {
        this.mesh.at(-1).vertices.push(Rngon.vertex(x, y, z, this.u, this.v, w));
    }

    function Translatef(x, y, z) {
        this.translate = Rngon.vector(x, y, z);
    }

    function Scalef(x, y, z) {
        this.scale = Rngon.vector(x, y, z);
    }

    // Differs from OpenGL in that there's no 'angle' parameter. Instead, each of the
    // XYZ parameters defines rotation (in degrees) for that axis.
    function Rotatef(x, y, z) {
        this.rotate = Rngon.vector(x, y, z);
    }

    function BindTexture(target, texture) {
        console.assert(target === OPENGL_1_1.TEXTURE_2D);
        this.texture = texture;
    }
})();

const glContext = {
    ...OPENGL_1_1,
    $reset()
    {
        this.mesh = [];
        this.texture = undefined;
        this.color = Rngon.color.white;
        this.translate = Rngon.vector(0, 0, 0);
        this.rotate = Rngon.vector(0, 0, 0);
        this.scale = Rngon.vector(1, 1, 1);
        this.u = 0;
        this.v = 0;
    },
};

export const sample = {
    initialize: async function()
    {
        this.woodTexture = await Rngon.texture.load("../samples/shared/textures/wood.rngon-texture.json");
    },
    tick: function()
    {
        this.numTicks++;
        this.cubeRotation = ((this.numTicks * 0.6) % 360);
        this.woodTexture.$isEnabled = parent.IS_TEXTURING_ENABLED;

        glContext.$reset();
        create_cube.call(this, glContext);

        return {
            mesh: Rngon.mesh(glContext.mesh, {
                scale: glContext.scale,
                rotate: glContext.rotate,
                translate: glContext.translate,
            }),
            renderOptions: {
                useBackfaceCulling: false,
            },
        };
    },
    numTicks: 0,
    cubeRotation: 0,
    woodTexture: undefined,
};
