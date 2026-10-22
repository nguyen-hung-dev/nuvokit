import type { GpuProbe } from "@nuvokit/core";

/** A successful browser compute test is not a claim of OCR/AI engine compatibility. */
export async function probeWebGpu(): Promise<GpuProbe> {
  const start = performance.now();
  const result = (status: GpuProbe["status"], message: string): GpuProbe => ({
    status,
    message,
    elapsedMs: Math.round(performance.now() - start),
  });
  if (!navigator.gpu)
    return result(
      "unsupported",
      "WebGPU không khả dụng trong môi trường này. Chức năng cơ bản vẫn dùng CPU.",
    );
  let device: GPUDevice | undefined;
  let input: GPUBuffer | undefined;
  let output: GPUBuffer | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  const compute = async () => {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("Không tìm thấy WebGPU adapter.");
    device = await adapter.requestDevice();
    if (expired) {
      device.destroy();
      throw new Error("Quá thời gian kiểm tra.");
    }
    input = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Uint32Array(input.getMappedRange()).set([1, 2, 3, 4]);
    input.unmap();
    output = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const module = device.createShaderModule({
      code: "@group(0) @binding(0) var<storage, read_write> values: array<u32>; @compute @workgroup_size(4) fn main(@builtin(global_invocation_id) id: vec3<u32>) { if (id.x < 4u) { values[id.x] = values[id.x] * 2u; } }",
    });
    const pipeline = await device.createComputePipelineAsync({
      layout: "auto",
      compute: { module, entryPoint: "main" },
    });
    if (expired) throw new Error("Quá thời gian kiểm tra.");
    const group = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: input } }],
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyBufferToBuffer(input, 0, output, 0, 16);
    device.queue.submit([encoder.finish()]);
    await output.mapAsync(GPUMapMode.READ);
    const values = Array.from(new Uint32Array(output.getMappedRange()));
    output.unmap();
    if (values.join(",") !== "2,4,6,8")
      throw new Error("Kết quả phép thử không đúng.");
    return result(
      "passed",
      "Phép tính WebGPU trả về kết quả đúng. Chưa xác nhận khả năng chạy OCR/AI hoặc backend vật lý.",
    );
  };
  try {
    return await Promise.race([
      compute(),
      new Promise<GpuProbe>((_, reject) => {
        timeout = setTimeout(() => {
          expired = true;
          reject(new Error("Quá thời gian kiểm tra."));
        }, 10000);
      }),
    ]);
  } catch {
    return result(
      "failed",
      "Phép thử WebGPU chưa thành công. Bạn vẫn có thể dùng các chức năng cơ bản.",
    );
  } finally {
    clearTimeout(timeout);
    input?.destroy();
    output?.destroy();
    device?.destroy();
  }
}
