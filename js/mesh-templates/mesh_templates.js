"use strict"

// Provides basic 3d objects for rendering. Note that these return an array of ngons, out of
// which you can then create a mesh.
const MeshTemplates =
{
      cube: function(texture = null, solidFill = true, wireframe = false)
      {
            return [
                  // Front.
                  RNGon.ngon([RNGon.vertex4(-0.5, -0.5, -0.5),
                              RNGon.vertex4(-0.5, 0.5, -0.5),
                              RNGon.vertex4(0.5, 0.5, -0.5),
                              RNGon.vertex4(0.5, -0.5, -0.5)],
                              RNGon.color_rgba(180, 180, 180), texture,
                              solidFill, wireframe),

                  // Back.
                  RNGon.ngon([RNGon.vertex4(0.5, -0.5, 0.5),
                              RNGon.vertex4(0.5, 0.5, 0.5),
                              RNGon.vertex4(-0.5, 0.5, 0.5),
                              RNGon.vertex4(-0.5, -0.5, 0.5)],
                              RNGon.color_rgba(170, 170, 170), texture,
                              solidFill, wireframe),

                  // Left.
                  RNGon.ngon([RNGon.vertex4(-0.5, -0.5, 0.5),
                              RNGon.vertex4(-0.5, 0.5, 0.5),
                              RNGon.vertex4(-0.5, 0.5, -0.5),
                              RNGon.vertex4(-0.5, -0.5, -0.5)],
                              RNGon.color_rgba(135, 135, 135), texture,
                              solidFill, wireframe),

                  // Right.
                  RNGon.ngon([RNGon.vertex4(0.5, -0.5, -0.5),
                              RNGon.vertex4(0.5, 0.5, -0.5),
                              RNGon.vertex4(0.5, 0.5, 0.5),
                              RNGon.vertex4(0.5, -0.5, 0.5)],
                              RNGon.color_rgba(110, 110, 110), texture,
                              solidFill, wireframe),

                  // Top.
                  RNGon.ngon([RNGon.vertex4(0.5, -0.5, -0.5),
                              RNGon.vertex4(0.5, -0.5, 0.5),
                              RNGon.vertex4(-0.5, -0.5, 0.5),
                              RNGon.vertex4(-0.5, -0.5, -0.5)],
                              RNGon.color_rgba(200, 200, 200), texture,
                              solidFill, wireframe),

                  // Bottom.
                  RNGon.ngon([RNGon.vertex4(-0.5, 0.5, 0.5),
                              RNGon.vertex4(0.5, 0.5, 0.5),
                              RNGon.vertex4(0.5, 0.5, -0.5),
                              RNGon.vertex4(-0.5, 0.5, -0.5)],
                              RNGon.color_rgba(160, 160, 160), texture,
                              solidFill, wireframe),
            ];
      },

      pyramid: function(texture = null, solidFill = true, wireframe = false)
      {
            return [
                  RNGon.ngon([RNGon.vertex4(-0.5, 0.5, -0.5),
                              RNGon.vertex4(0.5, 0.5, -0.5),
                              RNGon.vertex4(0, -0.5, 0)],
                              RNGon.color_rgba(180, 180, 180), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(-0.5, 0.5, 0.5),
                              RNGon.vertex4(0.5, 0.5, 0.5),
                              RNGon.vertex4(0, -0.5, 0)],
                              RNGon.color_rgba(170, 170, 170), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(-0.5, 0.5, -0.5),
                              RNGon.vertex4(-0.5, 0.5, 0.5),
                              RNGon.vertex4(0, -0.5, 0)],
                              RNGon.color_rgba(135, 135, 135), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(0.5, 0.5, -0.5),
                              RNGon.vertex4(0.5, 0.5, 0.5),
                              RNGon.vertex4(0, -0.5, 0)],
                              RNGon.color_rgba(110, 110, 110), texture,
                              solidFill, wireframe),

                  // Bottom.
                  RNGon.ngon([RNGon.vertex4(-0.5, 0.5, 0.5),
                              RNGon.vertex4(0.5, 0.5, 0.5),
                              RNGon.vertex4(0.5, 0.5, -0.5),
                              RNGon.vertex4(-0.5, 0.5, -0.5)],
                              RNGon.color_rgba(160, 160, 160), texture,
                              solidFill, wireframe)
            ]
      },

      diamond: function(texture = null, solidFill = true, wireframe = false)
      {
            return [
                  // Top pyramid
                  RNGon.ngon([RNGon.vertex4(-0.5, 0, -0.5),
                              RNGon.vertex4(0.5, 0, -0.5),
                              RNGon.vertex4(0, -1, 0)],
                              RNGon.color_rgba(180, 180, 180), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(-0.5, 0, 0.5),
                              RNGon.vertex4(0.5, 0, 0.5),
                              RNGon.vertex4(0, -1, 0)],
                              RNGon.color_rgba(170, 170, 170), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(-0.5, 0, -0.5),
                              RNGon.vertex4(-0.5, 0, 0.5),
                              RNGon.vertex4(0, -1, 0)],
                              RNGon.color_rgba(135, 135, 135), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(0.5, 0, -0.5),
                              RNGon.vertex4(0.5, 0, 0.5),
                              RNGon.vertex4(0, -1, 0)],
                              RNGon.color_rgba(110, 110, 110), texture,
                              solidFill, wireframe),

                  // Bottom pyramid
                  RNGon.ngon([RNGon.vertex4(-0.5, 0, -0.5),
                              RNGon.vertex4(0.5, 0, -0.5),
                              RNGon.vertex4(0, 1, 0)],
                              RNGon.color_rgba(180, 180, 180), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(-0.5, 0, 0.5),
                              RNGon.vertex4(0.5, 0, 0.5),
                              RNGon.vertex4(0, 1, 0)],
                              RNGon.color_rgba(170, 170, 170), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(-0.5, 0, -0.5),
                              RNGon.vertex4(-0.5, 0, 0.5),
                              RNGon.vertex4(0, 1, 0)],
                              RNGon.color_rgba(135, 135, 135), texture,
                              solidFill, wireframe),
                  RNGon.ngon([RNGon.vertex4(0.5, 0, -0.5),
                              RNGon.vertex4(0.5, 0, 0.5),
                              RNGon.vertex4(0, 1, 0)],
                              RNGon.color_rgba(110, 110, 110), texture,
                              solidFill, wireframe)
            ];
      },

      analog_clock: function(date = new Date)
      {
            const seconds = date.getSeconds() * ((Math.PI * 2) / 60);
            const minutes = date.getMinutes() * ((Math.PI * 2) / 60);
            const hours = ((date.getHours() % 12 + date.getMinutes()/60)) * ((Math.PI * 2) / 12);

            // Place dots at 5-minute intervals around the clock face's perimeter.
            const face = [...Array(12)].map((v, i)=>(RNGon.ngon([RNGon.vertex4((Math.cos(i*5 * ((Math.PI * 2) / 60)) * 7),
                                                                   (Math.sin(i*5 * ((Math.PI * 2) / 60)) * 7),
                                                                   0)], RNGon.color_rgba((i%3==0)*200, (i%3==0)*200, (i%3==0)*200), null, false, true)));

            const secondHand = RNGon.ngon([RNGon.vertex4(0, 0, 0),
                                           RNGon.vertex4(Math.cos(Math.PI/2 - seconds)*6.5, Math.sin(Math.PI/2 - seconds)*6.5, 0)],
                                           RNGon.color_rgba(170, 170, 170), null, true, false);
            const minuteHand = RNGon.ngon([RNGon.vertex4(0, 0, 0),
                                           RNGon.vertex4(Math.cos(Math.PI/2 - minutes)*6, Math.sin(Math.PI/2 - minutes)*6, 0)],
                                           RNGon.color_rgba(200, 200, 200), null, true, false);
            const hourHand = RNGon.ngon([RNGon.vertex4(0, 0, 0),
                                         RNGon.vertex4(Math.cos(Math.PI/2 - hours)*4.5, Math.sin(Math.PI/2 - hours)*4.5, 0)],
                                         RNGon.color_rgba(200, 200, 200), null, true, false);

            return [...face, hourHand, minuteHand, secondHand];
      },

      disc: function(numSides = 20, texture = null, solidFill = true, wireframe = false)
      {
            const angleDelta = ((2 * Math.PI) / numSides);

            const vertices = [...Array(numSides)].map((v, i)=>(RNGon.vertex4((Math.cos(i * angleDelta) * 0.5),
                                                                        (Math.sin(i * angleDelta) * 0.5),
                                                                        0)));

            return [RNGon.ngon(vertices, RNGon.color_rgba(180, 180, 180), texture, solidFill, wireframe)];
      },

      cylinder: function(numSides = 20, texture = null, solidFill = true, wireframe = false)
      {
            const angleDelta = ((2 * Math.PI) / numSides);

            const top = [...Array(numSides)].map((v, i)=>(RNGon.vertex4((Math.cos(i * angleDelta) * 0.5),
                                                                  0.5,
                                                                  (Math.sin(i * angleDelta) * 0.5))));
                                                                        
            const bottom = [...Array(numSides)].map((v, i)=>(RNGon.vertex4((Math.cos(i * angleDelta) * 0.5),
                                                                        -0.5,
                                                                        (Math.sin(i * angleDelta) * 0.5))));

            const sides = [...Array(numSides)].map((v, i)=>
            (
                  RNGon.ngon([RNGon.vertex4((Math.cos(i * angleDelta) * 0.5), 0.5, (Math.sin(i * angleDelta) * 0.5)),
                              RNGon.vertex4((Math.cos(i * angleDelta) * 0.5), -0.5, (Math.sin(i * angleDelta) * 0.5)),
                              RNGon.vertex4((Math.cos((i - 1) * angleDelta) * 0.5), 0.5, (Math.sin((i - 1) * angleDelta) * 0.5)),
                              RNGon.vertex4((Math.cos((i - 1) * angleDelta) * 0.5), -0.5, (Math.sin((i - 1) * angleDelta) * 0.5))],
                              RNGon.color_rgba(180, 180, 180), texture, solidFill, wireframe)
            ));

            return [
                  RNGon.ngon(top, RNGon.color_rgba(180, 180, 180), texture, solidFill, wireframe),
                  RNGon.ngon(bottom, RNGon.color_rgba(180, 180, 180), texture, solidFill, wireframe),
                  ...sides,
            ];
      },
};
