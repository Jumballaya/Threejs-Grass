import { GrassApplication } from "./GrassApplication";

import * as THREE from "three";

import "./style.css";
import { Library } from "./Library";
import { loadRockGeometry } from "./gltf/RockGLTF";

async function main() {
  const library = new Library();

  const dataTex = await library.loadArrayTextureFromBinary(
    "tile-data-0",
    "/tile_data/tile-group-0.data",
    256,
    256,
    64
  );
  dataTex.magFilter = THREE.LinearFilter;
  dataTex.minFilter = THREE.LinearFilter;
  const dirt = library.loadTexture("dirt", "/dirt1.png");
  dirt.wrapS = THREE.RepeatWrapping;
  dirt.wrapT = THREE.RepeatWrapping;

  library.loadShaderMaterial("ground", {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    diffuseTexture: { value: dirt },
    tileDataTexture: {
      value: library.getArrayTexture("tile-data-0"),
    },
    patchSize: { value: 0 },
    u_tile_id: { value: 0 },
  });

  library.loadShaderMaterial("grass", {
    grassParams: {
      value: new THREE.Vector4(0, 0, 0, 0),
    },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    tileDataTexture: {
      value: library.getArrayTexture("tile-data-0"),
    },
    u_tile_id: { value: 0 },
  });

  library.loadShaderMaterial("rocks", {
    rockParams: {
      value: new THREE.Vector4(0, 0, 0, 0),
    },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    tileDataTexture: {
      value: library.getArrayTexture("tile-data-0"),
    },
    u_tile_id: { value: 0 },
  });

  library.loadShaderMaterial("sky", {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  });

  library.loadInstancedGeometry("rocks", await loadRockGeometry());

  const app = new GrassApplication(library);

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
