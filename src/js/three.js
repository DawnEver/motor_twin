import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gui = new GUI();
const lightsFolder = gui.addFolder("Lights");
// const globalFolder = gui.addFolder('Global');

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const canvasDom = renderer.domElement;
canvasDom.style.position = 'absolute';
canvasDom.style.top = '0px';
canvasDom.style.left = '0px';
canvasDom.style.zIndex = -1;
document.body.appendChild(canvasDom);

const scene = new THREE.Scene();
scene.background = new THREE.Color("white");

// camera
const fov = 75, aspect = 2, near = 0.1, far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-20, 200, 0);

// control
const controls = new OrbitControls(camera, canvasDom);
controls.enablePan = true; // 是否开启右键拖拽
controls.dampingFactor = 0.5; // 动态阻尼系数 就是鼠标拖拽旋转灵敏度，阻尼越小越灵敏
controls.autoRotate = false; // 是否自动旋转

// 控制器
{
    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }
        get value() {
            return `#${this.object[this.prop].getHexString()}`;
        }
        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }
    const color = 0xf5f5f5;
    const groundColor = 0xffe4c4;
    const intensity = 5;
    const light = new THREE.HemisphereLight(color, groundColor, intensity)

    scene.add(light)
    lightsFolder.addColor(new ColorGUIHelper(light, "color"), "value").name("Sky Color");
    lightsFolder.addColor(new ColorGUIHelper(light, "groundColor"), "value").name("Ground Color");
    lightsFolder.add(light, "intensity", 0, 100, 1).name("Intensity");
}


// 载入模型
const loader = new GLTFLoader();
// motor + support
loader.load( 'src/public/models/main.glb', function ( gltf ) {
	scene.add( gltf.scene );
}, undefined, function ( error ) {
	console.error( error );
} );


var textureList = [];
function createLabel(width,height,x,y,z){
    const labelCanvas = document.createElement('canvas').getContext('2d');
    const font = `16px sans-serif`;
    labelCanvas.font = font;

    labelCanvas.canvas.width = width;
    labelCanvas.canvas.height = height;

    // need to set font again after resizing canvas
    // labelCanvas.font = font;

    // scale to fit but don't stretch
    labelCanvas.translate(width/2, height/2);
    labelCanvas.textBaseline = 'middle';
    labelCanvas.textAlign = 'center';
    labelCanvas.save();


    const texture = new THREE.CanvasTexture(labelCanvas.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    textureList.push(texture);

    const labelMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.5,
    });

    const label = new THREE.Sprite(labelMaterial);
    label.scale.x = labelCanvas.canvas.width;
    label.scale.y = labelCanvas.canvas.height;
    label.position.x = x;
    label.position.y = y;
    label.position.z = z;
    scene.add(label);
    return labelCanvas;
}
export function updateLabel(canvas,content){
    // canvas.translate(canvas.canvas.width/2, canvas.canvas.height/2);
    canvas.fillStyle = 'white';
    // canvas.clearRect(0,0, canvas.canvas.width, canvas.canvas.height);
    canvas.fillRect(-100,-30, canvas.canvas.width, canvas.canvas.height);
    canvas.restore();
    canvas.fillStyle = 'black';
    canvas.fillText(content, 0, 0);
}

// labels
export const labelCurrent = createLabel(200,100,110,60,-10);
updateLabel(labelCurrent,"Current(mA): None")
export const labelSpeed = createLabel(200,100,110,100,120);
updateLabel(labelSpeed,"Speed(rpm): None")


export function render() {
    // update texture and canvas
    textureList.forEach((texture)=>{
        texture.needsUpdate = true;
    });

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

