import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


const canvas = document.getElementById('app');

let canvasHeight = canvas.parentElement.clientHeight;
let canvasWidth = canvas.parentElement.clientWidth;

// renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas
});
renderer.setSize(canvasWidth, canvasHeight);
renderer.setClearColor(0x000000, 1.0);

// scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvasWidth / canvasHeight
);
camera.position.z = 15;

// mesh
const geometry = new THREE.SphereGeometry(
  8,
  500,
  500,
);
const vertexCount = geometry.attributes.position.array.length;
const vertexIDs = new Float32Array(vertexCount);
const lightFactor = new Float32Array(vertexCount);
for (let i = 0; i < vertexCount; i++) {
  vertexIDs[i] = i % 2;
  lightFactor[i] = Math.random();
}
geometry.setAttribute('vertexID', new THREE.BufferAttribute(vertexIDs, 1));
geometry.setAttribute('lightFactor', new THREE.BufferAttribute(lightFactor, 1));

const textureLoader = new THREE.TextureLoader();
const material = new THREE.ShaderMaterial({
  vertexColors: true,
  uniforms: {
    uTime: {
      value: 0,
    },
    uMinColor: {
      value: new THREE.Color('#FF5733'),
    },
    uMaxColor: {
      value: new THREE.Color('#FFFFFF'),
    },
    uCountryColor: {
      value: new THREE.Color('#00FF00'),
    },
    uSize: {
      value: 0.04,
    },
    uScale: {
      value: canvas.height,
    },
    uShape: {
      value: textureLoader.load('/public/circle.png'),
    },
    uAlphaMap: {
      value: textureLoader.load('/public/earth-spec.jpeg'),
    },
    uColorMap: {
      value: textureLoader.load('/public/earth-spec-color-map.png'),
    },
  },
  vertexShader: `
    attribute float vertexID;
    attribute float lightFactor;

    uniform float uSize;
    uniform float uScale;

    varying float vVertexID;
    varying float vLightFactor;
    varying vec2 vUv;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      vUv = uv;
      vVertexID = vertexID;
      vLightFactor = lightFactor;

      gl_PointSize = uSize * (uScale / length(mvPosition));
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uMinColor;
    uniform vec3 uMaxColor;
    uniform vec3 uCountryColor;
    uniform sampler2D uAlphaMap;
    uniform sampler2D uShape;
    uniform sampler2D uColorMap;
    
    varying float vVertexID;
    varying float vLightFactor;
    varying vec2 vUv;

    void main() {
      vec4 alphaColor = texture2D(uAlphaMap, vUv);
      if (length(alphaColor.rgb) > 1.0) discard;
      if (vVertexID == 0.0) discard;

      vec4 colorMap = texture2D(uColorMap, vUv);

      float mixStrength = abs(sin(uTime * vLightFactor));

      vec3 color;
      if (length(colorMap.rgb) > 1.0) {
        color = uCountryColor;
      } else {
        color = mix(uMinColor, uMaxColor, mixStrength);
      }

      vec4 shapeData = texture2D(uShape, gl_PointCoord);
      if (shapeData.a < 0.625) discard;
      gl_FragColor = vec4(color, 1.0) * shapeData.a;
    }
  `,
  transparent: true,
  alphaTest: true,
});
const mesh = new THREE.Points(geometry, material);
scene.add(mesh);

const controls = new OrbitControls(camera, canvas);

// render
renderer.setAnimationLoop(time => {
  mesh.rotation.y = time * 0.0001;
  material.uniforms.uTime.value = time * 0.001;
  controls.update();
  renderer.render(scene, camera);
});

// handle responsiveness
window.addEventListener('resize', event => {
  canvasHeight = canvas.parentElement.clientHeight;
  canvasWidth = canvas.parentElement.clientWidth;
  camera.aspect = canvasWidth / canvasHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    canvasWidth,
    canvasHeight
  );
  material.uniforms.uScale.value = canvas.height;
});
