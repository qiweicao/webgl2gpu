import { getElementById } from "../lib/utils.js";

async function main() {
  const canvas = getElementById("gl") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

  var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec3 a_color;
out vec3 color;

void main() {

  color = a_color;
  gl_Position = a_position;
}
`;

  var fragmentShaderSource = `#version 300 es

precision highp float;

out vec4 outColor;
in vec3 color;

void main() {
  outColor = vec4(color, 1);
}
`;

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  var fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  var program = createProgram(gl, vertexShader!, fragmentShader!);


  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // three 2d points
  // prettier-ignore
  const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, 0.0,
    0.8, -0.8, 0.0,
    0.8,  0.8, 0.0,
    -0.8,  0.8, 0.0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


  var positionAttributeLocation = gl.getAttribLocation(program!, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);

  var size = 3; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );


  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // prettier-ignore
  const colors = new Float32Array([
    1.0, 0.0, 0.0, // 🔴
    0.0, 1.0, 0.0, // 🟢
    0.0, 0.0, 1.0, // 🔵
    0.0, 0.0, 0.0  // ⚫
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  var colorAttributeLocation = gl.getAttribLocation(program!, "a_color");

  gl.enableVertexAttribArray(colorAttributeLocation);

  var size = 3; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    colorAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  // prettier-ignore
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0.4, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program!);
  gl.bindVertexArray(vao);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

main();

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  var shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  var program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}
