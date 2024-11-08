import { GLTFFile } from "./gltf/gltf.type";
import { GrassApplication } from "./GrassApplication";

import * as THREE from "three";

import "./style.css";
import { shaders } from "./shaders";

async function open_gltf(path: string, filename: string) {
  const res = await fetch(`${path}/${filename}`);
  const gltf: GLTFFile = await res.json();
  console.log(gltf);
  const buffers = await parse_gltf_buffers(gltf, path);

  const buffer = buffers[0];
  const bufferViews: ArrayBuffer[] = [];
  for (let i = 0; i < 3; i++) {
    const bv = gltf.bufferViews[i];
    bufferViews.push(
      buffer.slice(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength)
    );
  }

  const positions = new Float32Array(bufferViews[0]);
  const normals = new Float32Array(bufferViews[1]);
  const indices = Array.from(new Uint16Array(bufferViews[2]));

  const geo = new THREE.InstancedBufferGeometry();
  geo.instanceCount = 100;
  geo.setIndex(indices);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3, false));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3, false));

  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 21);

  return geo;
}

async function parse_gltf_buffers(gltfFile: GLTFFile, path: string) {
  const buffers: ArrayBuffer[] = [];
  for (const gltfBuffer of gltfFile.buffers) {
    const uri = gltfBuffer.uri;
    if (uri.startsWith("data:")) {
      const binRes = await fetch(uri);
      const buffer = await binRes.arrayBuffer();
      buffers.push(buffer);
      continue;
    }
    const binRes = await fetch(`${path}/${uri}`);
    const buffer = await binRes.arrayBuffer();
    buffers.push(buffer);
  }
  return buffers;
}

async function main() {
  const app = new GrassApplication();

  const rockGeo = await open_gltf("models/rock", "rock.gltf");
  const rockMat = new THREE.ShaderMaterial({
    vertexShader: shaders.rocks.vertex,
    fragmentShader: shaders.rocks.fragment,
  });
  const rockMesh = new THREE.Mesh(rockGeo, rockMat);
  rockMesh.position.set(0, 1, 0);

  app.scene.add(rockMesh);

  let time = Date.now();
  const loop = () => {
    const curTime = Date.now();
    const deltaTime = (curTime - time) / 1000;
    time = curTime;
    app.step(deltaTime);
    requestAnimationFrame(loop);
  };
  loop();
}
main();
