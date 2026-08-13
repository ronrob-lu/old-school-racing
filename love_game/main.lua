local spritesheets = {}
local images = {}

-- Game state
local car = {
    x = 400,
    y = 300,
    angle = 0,
    speed = 0,
    maxSpeed = 600,
    acceleration = 400,
    friction = 200,
    turnSpeed = 3,
    sprite = "car_blue_1.png"
}

local track = {}
local tileSize = 128
local trackWidth = 20
local trackHeight = 20
local camera = { x = 0, y = 0 }

function parseXML(filename, imageFile)
    local quads = {}
    local file = love.filesystem.read(filename)
    if not file then return quads end

    local image = love.graphics.newImage(imageFile)
    images[imageFile] = image

    local w, h = image:getDimensions()

    for name, x, y, width, height in file:gmatch('<SubTexture name="([^"]+)" x="(%d+)" y="(%d+)" width="(%d+)" height="(%d+)"/>') do
        quads[name] = {
            quad = love.graphics.newQuad(tonumber(x), tonumber(y), tonumber(width), tonumber(height), w, h),
            width = tonumber(width),
            height = tonumber(height)
        }
    end

    return quads
end

function generateTrack()
    for y = 1, trackHeight do
        track[y] = {}
        for x = 1, trackWidth do
            -- Simple track: grass everywhere, road in the middle
            if x >= 5 and x <= 15 then
                track[y][x] = "road_asphalt01.png"
            else
                track[y][x] = "land_grass01.png"
            end
        end
    end
end

function love.load()
    spritesheets.tiles = parseXML("Spritesheets/spritesheet_tiles.xml", "Spritesheets/spritesheet_tiles.png")
    spritesheets.vehicles = parseXML("Spritesheets/spritesheet_vehicles.xml", "Spritesheets/spritesheet_vehicles.png")
    spritesheets.objects = parseXML("Spritesheets/spritesheet_objects.xml", "Spritesheets/spritesheet_objects.png")
    generateTrack()
end

function love.update(dt)
    -- Car physics
    if love.keyboard.isDown("up") then
        car.speed = car.speed + car.acceleration * dt
    elseif love.keyboard.isDown("down") then
        car.speed = car.speed - car.acceleration * dt
    else
        -- Friction
        if car.speed > 0 then
            car.speed = math.max(0, car.speed - car.friction * dt)
        elseif car.speed < 0 then
            car.speed = math.min(0, car.speed + car.friction * dt)
        end
    end

    -- Limit speed
    if car.speed > car.maxSpeed then
        car.speed = car.maxSpeed
    elseif car.speed < -car.maxSpeed / 2 then
        car.speed = -car.maxSpeed / 2
    end

    -- Steering
    if car.speed ~= 0 then
        local turnDir = car.speed > 0 and 1 or -1
        if love.keyboard.isDown("left") then
            car.angle = car.angle - car.turnSpeed * turnDir * dt
        elseif love.keyboard.isDown("right") then
            car.angle = car.angle + car.turnSpeed * turnDir * dt
        end
    end

    -- Move car
    car.x = car.x + math.sin(car.angle) * car.speed * dt
    car.y = car.y - math.cos(car.angle) * car.speed * dt

    -- Update camera
    camera.x = car.x - love.graphics.getWidth() / 2
    camera.y = car.y - love.graphics.getHeight() / 2
end

function love.draw()
    love.graphics.push()
    love.graphics.translate(-camera.x, -camera.y)

    -- Draw track
    for y = 1, trackHeight do
        for x = 1, trackWidth do
            local tileName = track[y][x]
            local tileData = spritesheets.tiles[tileName]
            if tileData then
                love.graphics.draw(images["Spritesheets/spritesheet_tiles.png"], tileData.quad, (x-1)*tileSize, (y-1)*tileSize)
            end
        end
    end

    -- Draw car
    local carData = spritesheets.vehicles[car.sprite]
    if carData then
        -- Car sprite is originally pointing upwards in some sets or right in others,
        -- assuming pointing upwards based on the spritesheet structure
        love.graphics.draw(images["Spritesheets/spritesheet_vehicles.png"], carData.quad, car.x, car.y, car.angle, 1, 1, carData.width/2, carData.height/2)
    end

    love.graphics.pop()

    -- Draw HUD
    love.graphics.setColor(0, 0, 0, 0.5)
    love.graphics.rectangle("fill", 10, 10, 200, 30)
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.print("Speed: " .. math.floor(math.abs(car.speed)), 20, 20)
end
