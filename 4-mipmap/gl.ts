import { ReadonlyVec3, glMatrix, mat4 } from "../lib/gl-matrix/index.js";
import { getElementById, getImg } from "../lib/utils.js";

async function main() {
  const canvas = getElementById("gl") as HTMLCanvasElement;

  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

  const img = await getImg("https://learnopengl-cn.github.io/img/01/06/awesomeface.png");
  // const img = await getImg("https://webgl2fundamentals.org/webgl/resources/mip-low-res-example.png");

  var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec2 a_uv;

uniform mat4 u_matrix;

out vec2 texcoord;

void main() {

  texcoord = a_uv;

  gl_Position = u_matrix * a_position;

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
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    0.5, 0.5, 0,
    -0.5, 0.5, 0,
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
  const repeatTimes = 10
  // prettier-ignore
  const uvs = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    1.0, repeatTimes,
    0.0, repeatTimes,
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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

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
  gl.generateMipmap(gl.TEXTURE_2D);

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  // prettier-ignore
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0, 0, 0.4, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program!);
  gl.bindVertexArray(vao);


  var imageLocation = gl.getUniformLocation(program!, "u_image");
  gl.uniform1i(imageLocation, 0);

  var matrixLocation = gl.getUniformLocation(program!, "u_matrix");

  var settings = [
    { x: -1, y:  1, zRot: 1, magFilter: gl.NEAREST, minFilter: gl.NEAREST,                 },
    { x:  0, y:  1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR,                  },
    { x:  1, y:  1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.NEAREST_MIPMAP_NEAREST,  },
    { x: -1, y: -1, zRot: -1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR_MIPMAP_NEAREST,   },
    { x:  0, y: -1, zRot: -1, magFilter: gl.LINEAR,  minFilter: gl.NEAREST_MIPMAP_LINEAR,   },
    { x:  1, y: -1, zRot: -1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR_MIPMAP_LINEAR,    },
  ];

  settings.forEach((s) => {

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, s.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, s.magFilter);
    // Compute the matrix
    var aspect = gl.canvas.width / gl.canvas.height;
    var zNear = 1;
    var zFar = 2000;
    var fieldOfViewRadians = glMatrix.toRadian(60);
    var projectionMatrix = mat4.perspective(mat4.create(), fieldOfViewRadians, aspect, zNear, zFar);

    var cameraPosition: ReadonlyVec3 = [0, 0, 2];
    var up: ReadonlyVec3 = [0, 1, 0];
    var target: ReadonlyVec3 = [0, 0, 0];
    var cameraMatrix = mat4.lookAt(mat4.create(), cameraPosition, target, up);


    var translate = mat4.translate(mat4.create(), mat4.identity(mat4.create()), [s.x, s.y, -4.8]);
    var rotate = mat4.rotateX(mat4.create(), mat4.identity(mat4.create()), Math.PI / 2 * s.zRot);
    var scale = mat4.scale(mat4.create(), mat4.identity(mat4.create()), [0.8, repeatTimes, 1]);
    var modelMatrix = mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), translate, rotate), scale);

    var matrix = mat4.multiply(mat4.create(), projectionMatrix, mat4.multiply(mat4.create(), cameraMatrix, modelMatrix));
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  });

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

