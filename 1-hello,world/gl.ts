import { getElementById } from "../lib/utils.js";

async function main() {
  const canvas = getElementById("gl") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

  gl.clearColor(0, 0, 0.4, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main();
