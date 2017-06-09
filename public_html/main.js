var container;
var camera, scene, renderer;
var clock = new THREE.Clock();
var N = 128;
var geometry;
var imagedata;
var triangleMesh;
var targetList = [];
var keyboard = new THREEx.KeyboardState();
var key;
var check = false;
var intersects;
var circle, cylinder;
var originals = {};
originals.length = 0;
var targets = [];
var pressed = false;
var gui;
var draworder = [];
var picked = null;
var objs = {};
var mouse = {x: 0, y: 0};
var br = 1;
var dir = 0;
var sprtCount = 0;
var sprt1 = {};
var sprt2 = {};
var sprt3 = {};
var sprt4 = {};
var camAngle = 0.0;
var delta;
var delay;
var ok = false;
var models = [];
var smokeparticle = {};
var particles = [];
var wind = new THREE.Vector3(0, 0, 0);

var textureLoader = new THREE.TextureLoader();

var load_sprt = {};
var green_sprt = {};

init();
animate();

function init()
{
    container = document.getElementById('container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(N / 2, N / 2, N + N / 2);
    camera.lookAt(new THREE.Vector3(N / 2, 0, N / 2));

    cameraOrtho = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 1, 10);
    cameraOrtho.position.z = 10;

    sceneOrtho = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.addEventListener("contextmenu",
            function (event)
            {
                event.preventDefault();
            });
    container.appendChild(renderer.domElement);
    renderer.shadowMapEnabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    window.addEventListener('resize', onWindowResize, false);

    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('wheel', onDocumentMouseScroll, false);

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = new Image();

    img.onload = function ()
    {
        loading();

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        imagedata = context.getImageData(0, 0, img.width, img.height);

        addTriangle();
        loadModel('trees/', 'Tree.obj', 'Tree.mtl', 'tree');
        loadModel('trash/', 'Cyprys_House.obj', 'Cyprys_House.mtl', 'house');
        loadModel('trash/', 'Bush1.obj', 'Bush1.mtl', 'bush');
        //sceneOrtho.remove(load_sprt);
        //load_sprt.sprt.visible = false;
    };

    img.src = '3.bmp';
    createGUI();
    addBrush();
    lights();
    sky(800, 'sky.jpg');


    textureLoader.load("sprites/rain_part.png", loadSprite);

    sprt1.tex = textureLoader.load("sprites/tree.png", sprtLoad);
    sprt1.sprt = null;

    sprt2.tex = textureLoader.load("sprites/home.png", sprtLoad);
    sprt2.sprt = null;

    sprt3.tex = textureLoader.load("sprites/grade.png", sprtLoad);
    sprt3.sprt = null;
}

function loading()
{
    load_sprt.sprt = null;
    load_sprt.tex = textureLoader.load("sprites/load.jpg", ld);

    green_sprt.sprt = null;
    green_sprt.tex = textureLoader.load("sprites/green.png", ld);

}

var lscnt = 0;

function ld()
{
    lscnt++;

    if (lscnt == 2)
    {
        //load_sprt.sprt = ls(load_sprt.tex);

        green_sprt.sprt = ls(green_sprt.tex);
    }
}

function ls(texture)
{
    var material = new THREE.SpriteMaterial({map: texture});
    var width = window.innerWidth;//material.map.image.width;
    var height = window.innerHeight;//material.map.image.height;
    var sprite = new THREE.Sprite(material);
    sprite.scale.set(0.01, 0.01, 1);
    sprite.position.set(0, 0, 0);
    //   sprt = sprite;
    sceneOrtho.add(sprite);

    return sprite;
}

function ls2(texture)
{

}

function loadSprite(texture)
{
    var material = new THREE.SpriteMaterial({map: texture});

    smokeparticle.width = material.map.image.width / 64;
    smokeparticle.height = material.map.image.height / 64;
    smokeparticle.sprt = new THREE.Sprite(material);
    smokeparticle.sprt.scale.set(smokeparticle.width, smokeparticle.height, 1);
    ok = true;
}

function createParticle(pos)
{
    var t = {};

    t.width = smokeparticle.width;
    t.height = smokeparticle.height;
    t.sprt = smokeparticle.sprt.clone();

    t.sprt.scale.set(t.width / 2, t.height / 2, 1);

    t.sprt.position.copy(pos);
    t.v = new THREE.Vector3(0, -0.25, 0);
    t.o = 1.0;

    return t;
}

function sky(radius, textura)
{
    var geometry = new THREE.SphereGeometry(radius, 64, 64);

    var tex = new THREE.ImageUtils.loadTexture(textura);
    tex.minFilter = THREE.NearestFilter;


    var material = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
    });

    var sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    sphere.receiveShadow = true;
    sphere.castShadow = true;

    sphere.position.set(0, -150, 0);
}

function update()
{
    delay += delta;

    if (ok)
    {
        {
            if (particles.length < 1000)
            {
                var x = Math.random() * N;
                var y = (Math.random() * N * 20) + 70;
                var z = Math.random() * N;

                var t = createParticle(new THREE.Vector3(x, y, z));
                particles.push(t);
                scene.add(particles[particles.length - 1].sprt);
            }
            delay = 0;
        }

        for (var i = 0; i < particles.length; i++)
        {
            var t = new THREE.Vector3(0, 0, 0);
            t.copy(particles[i].v);
            t.add(wind);
            particles[i].sprt.position.add(t);

            if (particles[i].sprt.position.y < 0)
            {

                var x = Math.random() * N;
                var y = (Math.random() * 20) + 70;
                var z = Math.random() * N;

                particles[i].sprt.position.copy(new THREE.Vector3(x, y, z));
            }
        }
    }
}

function createGUI()
{
    gui = new dat.GUI();
    gui.width = 200;
    params =
            {
                x: 0, y: 0, z: 0,
                r: 0,
                brush: function () {
                    brush()
                },
                del: function () {
                    delMesh()
                }
            };

    var folder1 = gui.addFolder('Scale and rotation');
    var meshX = folder1.add(params, 'x').min(1).max(10).step(1).listen();
    var meshY = folder1.add(params, 'y').min(1).max(10).step(1).listen();
    var meshZ = folder1.add(params, 'z').min(1).max(10).step(1).listen();
    var meshRY = folder1.add(params, 'r').min(1).max(360).step(1).listen();
    folder1.open();

    meshRY.onChange(function (value)
    {
        if (models.length > 0)
        {
            var oldY = picked.rotation.y;

            picked.rotation.y = value * Math.PI / 180;
            picked.updateMatrixWorld();
            picked.userData.bbox.update();
            picked.userData.bbox.box.center(picked.userData.obb.position);
            picked.userData.bbox.rotation.y = value * Math.PI / 180;
            picked.userData.obb.basis.extractRotation(picked.matrixWorld);

            var rez = false;

            for (var i = 0; i < targets.length; i++) {
                if (targets[i].userData !== picked)
                {
                    rez = intersect(picked.userData, targets[i].userData.userData);

                    if (rez === true)
                    {
                        picked.rotation.y = oldY;
                        picked.updateMatrixWorld();
                        picked.userData.bbox.update();
                        picked.userData.bbox.box.center(picked.userData.obb.position);
                        picked.userData.bbox.rotation.y = oldY;
                        picked.userData.obb.basis.extractRotation(picked.matrixWorld);
                        break;
                    }
                }
            }


        }
    });
    meshX.onChange(function (value)
    {
        if (models.length > 0)
        {
            if (picked)
            {
                picked.scale.x = value / 10;
                picked.userData.bbox.update();
            }
        }
    });

    meshY.onChange(function (value)
    {
        if (models.length > 0)
        {
            picked.scale.y = value / 10;
            picked.userData.bbox.update();
        }
    });

    meshZ.onChange(function (value)
    {
        if (models.length > 0)
        {
            picked.scale.z = value / 10;
            picked.userData.bbox.update();
        }
    });

    var folder3 = gui.addFolder('Objects');
    folder3.add(params, 'del').name("delete");
    folder3.open();

    gui.add(params, 'brush').name('brush').listen();

    gui.open();
}

function brush()
{
    br = br * -1;
}

function addMesh(i, s)
{
    models.push(originals[i].clone());
    models[models.length - 1].scale.copy(s);
    models[models.length - 1].position.set(0, 5, 0);

    draworder.push(models[models.length - 1]);
    scene.add(models[models.length - 1]);

    var bbox = new THREE.BoundingBoxHelper(models[models.length - 1], 0x00ff00);
    bbox.update();

    models[models.length - 1].userData.bbox = bbox;
    models[models.length - 1].userData.bbox.material.visible = false;

    var obb = {};
    obb.basis = new THREE.Matrix4();
    obb.halfSize = new THREE.Vector3();
    obb.position = new THREE.Vector3();

    var aabb;
    aabb = bbox.box;

    aabb.center(obb.position);
    obb.basis.extractRotation(models[models.length - 1].matrixWorld);
    aabb.size(obb.halfSize).multiplyScalar(0.5);

    models[models.length - 1].userData.obb = obb;

    models[models.length - 1].userData.bbox.userData = models[models.length - 1];

    scene.add(bbox);
    targets.push(models[models.length - 1].userData.bbox);
}

function delMesh()
{
    if (models.length > 0)
    {
        if (picked)
        {
            var ind = models.indexOf(picked);
            if (~ind)
                models.splice(ind, 1);

            var ind1 = targets.indexOf(picked.userData.bbox);
            if (~ind1)
                targets.splice(ind1, 1);

            scene.remove(picked);
            scene.remove(picked.userData.bbox);
        }
    }
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render()
{
    delta = clock.getDelta();
    update();
    renderer.render(scene, camera);
    renderer.clear();
    renderer.autoClear = false;
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(sceneOrtho, cameraOrtho);
}

function animate()
{
    requestAnimationFrame(animate);

    if (dir != 0)
        grow(dir);
    keyboardstate();
    render();
}

function progress(proc, name)
{

}
function loadModel(path, oname, mname, name)
{
    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
            progress(percentComplete, name);
//            if (percentComplete > 99)
//            {
//                load_sprt.sprt.visible = false;
//                green_sprt.sprt.visible = false;
//
//                console.log(load_sprt.sprt);
//                sceneOrtho.remove(load_sprt.sprt);
//            }
        }
    };

    var onError = function (xhr) {
        console.log('error');
    };

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setBaseUrl(path);
    mtlLoader.setPath(path);

    mtlLoader.load(mname, function (materials)
    {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(path);

        objLoader.load(oname, function (object)
        {
            object.position.x = 0;
            object.position.y = 0;
            object.position.z = 0;


            object.castShadow = true;

            object.traverse(function (child)
            {
                if (child instanceof THREE.Mesh)
                {
                    child.castShadow = true;
                }
            });

            model = object;
            originals[name] = object;
            originals.length++;
        }, onProgress, onError);
    });
}

function lights()
{
    var light = new THREE.SpotLight(0xffffff);
    light.position.set(N / 2, N * 3, N / 2);
    light.target.position.set(N / 2, 0, N / 2);
    light.castShadow = true;
    light.shadow.camera.near = 70;
    light.shadow.camera.far = 500;
    light.shadow.camera.fov = 90;
    light.shadow.bias = 0.0001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light.target);
    scene.add(light);
}

function addTriangle()
{
    geometry = new THREE.Geometry();

    for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++)
        {
            var heigh_1 = getPixel(imagedata, i, j);

            geometry.vertices.push(new THREE.Vector3(i, heigh_1 / 10.0, j));
        }
    }
    for (i = 0; i < N - 1; i++) {
        for (j = 0; j < N - 1; j++)
        {
            geometry.faces.push(new THREE.Face3((i + j * N), (i + 1 + j * N), (i + (j + 1) * N)));
            geometry.faces.push(new THREE.Face3((i + (j + 1) * N), ((i + 1) + j * N), ((i + 1) + (j + 1) * N)));


            geometry.faceVertexUvs[0].push([new THREE.Vector2(i / N, j / N),
                new THREE.Vector2((i + 1) / N, j / N),
                new THREE.Vector2((i) / N, (j + 1) / N)]);
            geometry.faceVertexUvs[0].push([new THREE.Vector2(i / N, (j + 1) / N),
                new THREE.Vector2((i + 1) / N, (j) / N),
                new THREE.Vector2((i + 1) / N, (j + 1) / N)]);
        }
    }
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var tex = new THREE.ImageUtils.loadTexture('grasstile.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);

    var mat = new THREE.MeshPhongMaterial({
        map: tex,
        side: THREE.DoubleSide
    });
    triangleMesh = new THREE.Mesh(geometry, mat);
    triangleMesh.position.set(0.0, 0.0, 0.0);
    triangleMesh.scale.set(1.0, 1, 1.0);
    triangleMesh.receiveShadow = true;
    triangleMesh.castShadow = true;

    targetList.push(triangleMesh);

    scene.add(triangleMesh);
}

function getPixel(imagedata, x, y)
{
    var position = (x + imagedata.width * y) * 4, data = imagedata.data;
    return data[ position ];
}

function onDocumentMouseScroll(event)
{
    if (event.wheelDelta > 0)
        if (circle.radius < N / 8)
            circle.radius += 1;

    if (event.wheelDelta < 0)
        if (circle.radius > 1)
            circle.radius -= 1;

    circle.scale.x = circle.radius;
    circle.scale.z = circle.radius;
}

function onDocumentMouseMove(event)
{
    if (br === 1)
    {
        circle.visible = true;
        cylinder.visible = true;
        var mouse = {x: 0, y: 0};
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        vector.unproject(camera);
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        var intersects = ray.intersectObjects(targetList);
        if (intersects.length > 0)
        {
            circle.position.copy(intersects[ 0 ].point);
            circle.position.y += 0.5;
            cylinder.position.copy(intersects[ 0 ].point);
            cylinder.position.y += 2.5;
        }
    } else
    {
        if (pressed)
        {
            var mouse = {x: 0, y: 0};
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
            vector.unproject(camera);
            var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
            var intersects = ray.intersectObjects(targetList);

            if (picked != null)
                if (intersects.length > 0)
                {
                    var oldPos = new THREE.Vector3();
                    oldPos.copy(picked.position);

                    picked.position.copy(intersects[ 0 ].point);
                    picked.userData.bbox.update();
                    picked.userData.bbox.box.center(picked.userData.obb.position);

                    var rez = false;

                    for (var i = 0; i < targets.length; i++)
                    {
                        if (targets[i].userData !== picked)
                        {
                            rez = intersect(picked.userData, targets[i].userData.userData);
                        }
                        if (rez === true)
                        {
                            picked.position.copy(oldPos);
                            picked.userData.bbox.update();
                            picked.userData.bbox.box.center(picked.userData.obb.position);
                            break;
                        }
                    }
                }
        }

        circle.visible = false;
        cylinder.visible = false;
    }
}

function onDocumentMouseDown(event)
{
    if (br === 1)
    {
        if (event.which === 1)
            dir = 1;
        else
            dir = -1;
    } else
    {
        pressed = true;
        if (picked !== null)
            picked.userData.bbox.material.visible = false;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
        vector.unproject(camera);
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = ray.intersectObjects(targets);

        if (intersects.length > 0)
        {
            picked = intersects[0].object.userData;

            picked.userData.bbox.material.visible = true;
        } else
        {
            picked = null;
        }
    }

    if ((event.clientX > 0) && (event.clientX < 150) && (event.clientY > 0) && (event.clientY < 150))
    {
        addMesh('tree', new THREE.Vector3(0.1, 0.1, 0.1));
    }

    if ((event.clientX > 150) && (event.clientX < 280) && (event.clientY > 0) && (event.clientY < 150))
    {
        addMesh('house', new THREE.Vector3(0.8, 0.8, 0.8));
    }

    if ((event.clientX > 280) && (event.clientX < 430) && (event.clientY > 0) && (event.clientY < 150))
    {
        addMesh('bush', new THREE.Vector3(2, 2, 2));
    }
}

function onDocumentMouseUp(event)
{
    if (br === 1)
    {
        dir = 0;
    } else
    {
        pressed = false;
    }
}

function addBrush()
{
    var radius = 10;

    var material = new THREE.LineBasicMaterial({
        color: 0xffff00
    });
    var segments = 164;

    var circleGeometry = new THREE.CircleGeometry(1, segments);

    for (var i = 0; i < circleGeometry.vertices.length; i++)
    {
        circleGeometry.vertices[i].z = circleGeometry.vertices[i].y;
        circleGeometry.vertices[i].y = 0;
    }
    circleGeometry.vertices.shift();

    circle = new THREE.Line(circleGeometry, material);
    circle.radius = 10;
    circle.scale.set(radius, 1, radius);


    var geometry = new THREE.CylinderGeometry(3, 0, 8, 64);
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    var cyMaterial = new THREE.MeshBasicMaterial({color: 0x888888});
    cylinder = new THREE.Mesh(geometry, cyMaterial);

    scene.add(circle);
    scene.add(cylinder);
}

function grow(dir)
{
    var h = 0.0;
    var x1 = Math.floor(cylinder.position.x);
    var z1 = Math.floor(cylinder.position.z);

    var xmin = Math.floor(x1 - (circle.radius));
    var zmin = Math.floor(z1 - (circle.radius));

    if (xmin < 0)
        xmin = 0;
    if (zmin < 0)
        zmin = 0;

    var xmax = Math.floor(x1 + (circle.radius));
    var zmax = Math.floor(z1 + (circle.radius));

    if (xmax > N)
        xmax = N;
    if (zmax > N)
        zmax = N;

    for (var i = xmin; i < xmax; i++)
        for (var j = zmin; j < zmax; j++)
        {
            var x2 = (i - x1) * (i - x1);
            var z2 = (j - z1) * (j - z1);

            h = ((circle.radius * circle.radius) - (x2 + z2));

            if (h >= 0)
            {
                triangleMesh.geometry.vertices[j + i * N].y += dir * (Math.sqrt(h) * 0.05);
            }
        }

    triangleMesh.geometry.computeFaceNormals();
    triangleMesh.geometry.computeVertexNormals();
    triangleMesh.geometry.verticesNeedUpdate = true;
    triangleMesh.geometry.normalsNeedUpdate = true;
}

function intersect(ob1, ob2)
{
    var xAxisA = new THREE.Vector3();

    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();

    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();
    var zAxisB = new THREE.Vector3();

    var translation = new THREE.Vector3();

    var vector = new THREE.Vector3();

    var axisA = [];
    var axisB = [];
    var rotationMatrix = [[], [], []];
    var rotationMatrixAbs = [[], [], []];

    var _EPSILON = 1e-3;

    var halfSizeA, halfSizeB;
    var t, i;

    ob1.obb.basis.extractBasis(xAxisA, yAxisA, zAxisA);
    ob2.obb.basis.extractBasis(xAxisB, yAxisB, zAxisB);

    axisA.push(xAxisA, yAxisA, zAxisA);
    axisB.push(xAxisB, yAxisB, zAxisB);

    vector.subVectors(ob2.obb.position, ob1.obb.position);

    for (i = 0; i < 3; i++)
    {
        translation.setComponent(i, vector.dot(axisA[ i ]));
    }

    for (i = 0; i < 3; i++)
    {
        for (var j = 0; j < 3; j++)
        {
            rotationMatrix[ i ][ j ] = axisA[ i ].dot(axisB[ j ]);
            rotationMatrixAbs[ i ][ j ] = Math.abs(rotationMatrix[ i ][ j ]) + _EPSILON;
        }
    }

    for (i = 0; i < 3; i++)
    {
        vector.set(rotationMatrixAbs[ i ][ 0 ], rotationMatrixAbs[ i ][ 1 ], rotationMatrixAbs[ i ][ 2 ]);

        halfSizeA = ob1.obb.halfSize.getComponent(i);
        halfSizeB = ob2.obb.halfSize.dot(vector);


        if (Math.abs(translation.getComponent(i)) > halfSizeA + halfSizeB)
        {
            return false;
        }
    }

    for (i = 0; i < 3; i++)
    {
        vector.set(rotationMatrixAbs[ 0 ][ i ], rotationMatrixAbs[ 1 ][ i ], rotationMatrixAbs[ 2 ][ i ]);

        halfSizeA = ob1.obb.halfSize.dot(vector);
        halfSizeB = ob2.obb.halfSize.getComponent(i);

        vector.set(rotationMatrix[ 0 ][ i ], rotationMatrix[ 1 ][ i ], rotationMatrix[ 2 ][ i ]);
        t = translation.dot(vector);

        if (Math.abs(t) > halfSizeA + halfSizeB)
        {
            return false;
        }
    }

    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 1 ];

    t = translation.z * rotationMatrix[ 1 ][ 0 ] - translation.y * rotationMatrix[ 2 ][ 0 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 0 ];

    t = translation.z * rotationMatrix[ 1 ][ 1 ] - translation.y * rotationMatrix[ 2 ][ 1 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 1 ] + ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 0 ];

    t = translation.z * rotationMatrix[ 1 ][ 2 ] - translation.y * rotationMatrix[ 2 ][ 2 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 1 ];

    t = translation.x * rotationMatrix[ 2 ][ 0 ] - translation.z * rotationMatrix[ 0 ][ 0 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 1 ][ 0 ];

    t = translation.x * rotationMatrix[ 2 ][ 1 ] - translation.z * rotationMatrix[ 0 ][ 1 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z * rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 0 ];

    t = translation.x * rotationMatrix[ 2 ][ 2 ] - translation.z * rotationMatrix[ 0 ][ 2 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 0 ] + ob1.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 2 ][ 1 ];

    t = translation.y * rotationMatrix[ 0 ][ 0 ] - translation.x * rotationMatrix[ 1 ][ 0 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob1.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z * rotationMatrixAbs[ 2 ][ 0 ];

    t = translation.y * rotationMatrix[ 0 ][ 1 ] - translation.x * rotationMatrix[ 1 ][ 1 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }

    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob1.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ];

    t = translation.y * rotationMatrix[ 0 ][ 2 ] - translation.x * rotationMatrix[ 1 ][ 2 ];

    if (Math.abs(t) > halfSizeA + halfSizeB)
    {
        return false;
    }
    return true;
}

function sprtLoad()
{
    sprtCount++;
    console.log('1');

    if (sprtCount === 3)
        sprtSet();
}

function createSprt(texture, position)
{
    var material = new THREE.SpriteMaterial({map: texture});
    var width = material.map.image.width;
    var height = material.map.image.height;
    var sprite = new THREE.Sprite(material);
    sprite.scale.set(width / 3, height / 3, 1);
    sprite.position.copy(position);

    sceneOrtho.add(sprite);
    console.log(sprite);
    return sprite;
}

function sprtSet()
{
    sprt1.sprt = createSprt(sprt1.tex, new THREE.Vector3(-window.innerWidth / 2 + 70, window.innerHeight / 2 - 70, 0));
    sprt2.sprt = createSprt(sprt2.tex, new THREE.Vector3(-window.innerWidth / 2 + 210, window.innerHeight / 2 - 70, 0));
    sprt3.sprt = createSprt(sprt3.tex, new THREE.Vector3(-window.innerWidth / 2 + 350, window.innerHeight / 2 - 70, 0));
}

function keyboardstate()
{
    if (keyboard.pressed("a"))
    {
        camAngle += 0.04;
    }

    if (keyboard.pressed("d"))
    {
        camAngle -= 0.04;
    }

    var x = N / 2 + N * Math.cos(camAngle);
    var z = N / 2 + N * Math.sin(camAngle);
    camera.lookAt(new THREE.Vector3(N / 2, 0, N / 2));
    camera.position.set(x, 50, z);
}