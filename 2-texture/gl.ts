import { getElementById, getImg } from "../lib/utils.js";

async function main() {
  const canvas = getElementById("gl") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

  const img = await getImg("https://learnopengl-cn.github.io/img/01/06/awesomeface.png");

  var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec2 a_uv;
out vec2 texcoord;

void main() {

  texcoord = a_uv;
  gl_Position = a_position;
}
`;

  var fragmentShaderSource = `#version 300 es

precision highp float;

uniform sampler2D u_image;
in vec2 texcoord;

out vec4 outColor;


void main() {
  outColor = vec4(texture(u_image, texcoord).rgb, 1);
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

  var uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  // prettier-ignore
  const uvs = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  var uvAttributeLocation = gl.getAttribLocation(program!, "a_uv");

  gl.enableVertexAttribArray(uvAttributeLocation);

  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    uvAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  var mipLevel = 0;               // the largest mip
  var internalFormat = gl.RGBA;   // format we want in the texture
  var srcFormat = gl.RGBA;        // format of data we are supplying
  var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
  gl.texImage2D(
    gl.TEXTURE_2D,
    mipLevel,
    internalFormat,
    srcFormat,
    srcType,
    img
  );

  var imageLocation = gl.getUniformLocation(program!, "u_image");
  gl.uniform1i(imageLocation, 0);

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
