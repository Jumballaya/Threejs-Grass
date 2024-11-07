import * as THREE from "three";

type TextureEntry = {
  textures: Array<() => ImageData>;
  atlas?: THREE.DataArrayTexture;
};

function getImageData(image: THREE.Texture["image"]) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d")!;
  context.translate(0, image.height);
  context.scale(1, -1);
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

export class TextureAtlas {
  private manager: THREE.LoadingManager;
  private loader: THREE.TextureLoader;
  private textures: Record<string, TextureEntry> = {};

  private listeners = {
    onLoad: () => {},
  };

  constructor() {
    this.manager = new THREE.LoadingManager();
    this.loader = new THREE.TextureLoader(this.manager);
    this.manager.onLoad = () => {
      this.onManagerLoad();
    };
  }

  public set onLoad(handler: () => void) {
    this.listeners.onLoad = handler;
  }

  public get Info() {
    return this.textures;
  }

  public loadAtlas(atlas: string, files: string[]) {
    this.textures[atlas] = {
      textures: files.map((n) => this.loadType(n)),
    };
  }

  public loadAtlasFromBinary(
    atlas: string,
    binary: Uint8Array,
    width: number,
    height: number,
    depth: number
  ): void {
    const texture = this.createDataArrayTexture(binary, width, height, depth);
    this.textures[atlas] = {
      atlas: texture,
      textures: [],
    };
    this.listeners.onLoad();
  }

  private onManagerLoad(): void {
    for (let k in this.textures) {
      let x: number | undefined;
      let y: number | undefined;
      const atlas = this.textures[k];
      let data: Uint8Array = new Uint8Array();

      for (let t = 0; t < atlas.textures.length; t++) {
        const loader = atlas.textures[t];
        const curData = loader();
        const h = curData.height;
        const w = curData.width;

        if (x == undefined) {
          x = w;
          y = h;
          data = new Uint8Array(atlas.textures.length * 4 * x * y);
        }

        if (w !== x || h !== y) {
          console.error("Texture dimensions do not match");
          return;
        }
        const offset = t * (4 * w * h);
        data.set(curData.data, offset);
      }

      console.log(x!, y!, atlas.textures.length);

      const diffuse = this.createDataArrayTexture(
        data,
        x!,
        y!,
        atlas.textures.length
      );
      atlas.atlas = diffuse;
    }

    this.listeners.onLoad();
  }

  private loadType(t: string | ImageData): () => ImageData {
    if (typeof t === "string") {
      const texture = this.loader.load(t);
      return () => {
        return getImageData(texture.image);
      };
    }
    return () => {
      return t;
    };
  }

  private createDataArrayTexture(
    data: Uint8Array,
    w: number,
    h: number,
    depth: number
  ) {
    const texture = new THREE.DataArrayTexture(data, w, h, depth);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }
}
