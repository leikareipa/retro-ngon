/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 * Provides a sample implementation of a first-person camera for the retro
 * n-gon renderer, operated using the mouse and keyboard.
 * 
 */

// Sets up the given DOM element to grab the mouse when the user clicks on the
// element; and intercepts mouse and keyboard events to update the camera's
// position and direction.
//
// Usage:
//
//   1. Construct a camera object:
//
//      const camera = first_person_camera("canvas-id", {...});
//
//      The string "canvas-id" is the ID in the DOM of an existing canvas
//      element on which this camera should listen for user input.
//
//
//   2. Have the camera update its direction and position as per mouse and
//      keyboard input from the user:
//
//      camera.update();
//
//      You'd call this once before each frame is rendered.
//
//
//   3. Use the camera's position and direction when rendering:
//
//      render(..., {position: camera.position, direction: camera.direction});
//
//
export function first_person_camera(domElementId = "", {
    position = {x:0, y:0, z:0},
    direction = {x:0, y:0, z:0},
    rotationSpeed = {x: 1, y: 1},
    movementSpeed = 0.1,
    allowMovement = true,
    allowRotation = true,
    allowPointerLock = true,
    callback_pointer_lock_acquired = ()=>{},
    callback_pointer_lock_released = ()=>{},
} = {})
{
    const targetDOMCanvas = document.getElementById(domElementId);
    if (!targetDOMCanvas)
    {
        window.alert("First-person camera: Invalid canvas element.");
    }

    // For measuring time elapsed between successive calls to update().
    let totalRunTime = 0;
    let frameDelta = 0;

    // In which direction(s) the camera is currently moving.
    const movementStatus =
    {
        forward:  false,
        backward: false,
        left:     false,
        right:    false,
        up:       false,
        down:     false,
    };

    if (allowPointerLock)
    {
        targetDOMCanvas.onclick = ()=>
        {
            targetDOMCanvas.requestPointerLock();
        };

        document.addEventListener('pointerlockchange', ()=>
        {
            if (document.pointerLockElement == targetDOMCanvas)
            {
                document.addEventListener("mousemove", listener_mouse_move, false);
                document.addEventListener("keydown",   listener_key_down,   false);
                document.addEventListener("keyup",     listener_key_up,     false);

                callback_pointer_lock_acquired();
            }
            else
            {
                document.removeEventListener("mousemove", listener_mouse_move, false);
                document.removeEventListener("keydown",   listener_key_down,   false);
                document.removeEventListener("keyup",     listener_key_up,     false);

                callback_pointer_lock_released();
            }
        }, false);
    }

    return {
        get position()
        {
            return Rngon.vector(position.x, position.y, position.z);
        },

        get direction()
        {
            return Rngon.vector(direction.x, direction.y, direction.z);
        },

        update: function()
        {
            frameDelta = (performance.now() - totalRunTime);
            totalRunTime += frameDelta;

            if (allowMovement)
            {
                const forwardVector = Rngon.vector(direction.x, direction.y, direction.z);
                const movement = get_accumulated_movement(forwardVector, (movementSpeed * frameDelta));

                position.x -= movement.x;
                position.y += movement.y;
                position.z += movement.z;
            }

            return;
        },
    }

    function listener_mouse_move(event)
    {
        if (allowRotation)
        {
            direction.x += ((event.movementY / 6) * rotationSpeed.x);
            direction.y += ((event.movementX / 6) * rotationSpeed.y);
        }

        return;
    }

    function listener_key_down(event)
    {
        switch (event.key.toLowerCase())
        {
            case "e": movementStatus.forward  = true; break;
            case "d": movementStatus.backward = true; break;
            case "s": movementStatus.left     = true; break;
            case "f": movementStatus.right    = true; break;
            case "q": movementStatus.up       = true; break;
            case "a": movementStatus.down     = true; break;
            default: break;
        }

        return;
    }

    function listener_key_up(event)
    {
        switch (event.key.toLowerCase())
        {
            case "e": movementStatus.forward  = false; break;
            case "d": movementStatus.backward = false; break;
            case "s": movementStatus.left     = false; break;
            case "f": movementStatus.right    = false; break;
            case "q": movementStatus.up       = false; break;
            case "a": movementStatus.down     = false; break;
            default: break;
        }

        return;
    }

    function get_accumulated_movement(forwardVector, movementSpeed)
    {
        const cameraRotationMatrix = Rngon.matrix.rotating(0, forwardVector.y, 0);

        const accumulatedMovement = Rngon.vector(
            (movementStatus.left?    1 : movementStatus.right?    -1 : 0),
            (movementStatus.up?      1 : movementStatus.down?     -1 : 0),
            (movementStatus.forward? 1 : movementStatus.backward? -1 : 0)
        );

        Rngon.vector.normalize(accumulatedMovement);
        Rngon.vector.transform(accumulatedMovement, cameraRotationMatrix);

        accumulatedMovement.x *= movementSpeed;
        accumulatedMovement.y *= movementSpeed;
        accumulatedMovement.z *= movementSpeed;

        return accumulatedMovement;
    }
}
