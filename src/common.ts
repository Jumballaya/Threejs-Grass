export const FILE_BASE = import.meta.env.DEV ? "" : "/Threejs-Grass";

export function save_binary(data: ArrayBuffer, name: string) {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
