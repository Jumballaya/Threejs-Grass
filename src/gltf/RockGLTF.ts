import * as THREE from "three";
import { GLTFFile } from "./gltf.type";

export async function loadRockGeometry() {
  const [positions, normals, indices] = await open_gltf(
    "models/rock/",
    "rock.gltf"
  );
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3, false));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3, false));
  return geo;
}

async function open_gltf(
  path: string,
  filename: string
): Promise<[Float32Array, Float32Array, number[]]> {
  const res = await fetch(`${path}/${filename}`);
  const gltf: GLTFFile = await res.json();
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

  return [positions, normals, indices];
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
