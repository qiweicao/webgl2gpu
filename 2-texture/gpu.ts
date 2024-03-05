import { getElementById } from "../lib/utils.js";

async function main() {
  const canvas = getElementById("gpu") as HTMLCanvasElement;

  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }

  const device = await adapter.requestDevice();

  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });

  // prettier-ignore
  const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, 0.0,
    0.8, -0.8, 0.0,
    0.8,  0.8, 0.0,
    -0.8,  0.8, 0.0,
  ]);
  // prettier-ignore
  const colors = new Float32Array([
    1.0, 0.0, 0.0, // 🔴
    0.0, 1.0, 0.0, // 🟢
    0.0, 0.0, 1.0, // 🔵
    0.0, 0.0, 0.0  // ⚫
  ]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices);

  const colorBuffer = device.createBuffer({
    size: colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(colorBuffer, /*bufferOffset=*/ 0, colors);

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 12,
    attributes: [
      {
        format: "float32x3",
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
      },
    ],
  };

  const colorBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 12,
    attributes: [
      {
        format: "float32x3",
        offset: 0,
        shaderLocation: 1, // Position, see vertex shader
      },
    ],
  };

  const indexBuffer = device.createBuffer({
    label: "Cell indices",
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, /*bufferOffset=*/ 0, indices);

  const cellShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: `
      // Your shader code will go here

      struct VertexInput {
        @location(0) pos: vec3f,
        @location(1) color: vec3f,
      };

      struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) color: vec3f,
      };

      struct FragInput {
        @location(0) color: vec3f,
      };


      @vertex
      fn vertexMain(input: VertexInput)  -> VertexOutput {

        var output: VertexOutput;
        output.pos = vec4f(input.pos, 1);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fragmentMain(input: FragInput) -> @location(0) vec4f {
        return vec4f(input.color, 1);
      }
    `,
  });

  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto", // Updated!
    vertex: {
      module: cellShaderModule,
      entryPoint: "vertexMain",
      buffers: [vertexBufferLayout, colorBufferLayout],
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
  });

  const encoder = device.createCommandEncoder();

  // Start a render pass
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(cellPipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setVertexBuffer(1, colorBuffer);
  pass.setIndexBuffer(indexBuffer, "uint16");
  pass.drawIndexed(6);
  // End the render pass and submit the command buffer
  pass.end();
  device.queue.submit([encoder.finish()]);
}

main();
