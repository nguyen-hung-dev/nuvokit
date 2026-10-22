import { describe, expect, it } from "vitest";
import {
  coreReady,
  formatBytes,
  jobRunning,
  safePercent,
  type EnvironmentReport,
  type JobProgress,
} from "./index";

describe("core readiness", () => {
  const report = {
    os: { supported: true },
    dependencies: [
      { required: true, status: "ready" },
      { required: false, status: "missing" },
    ],
  } as EnvironmentReport;
  it("optional AI/OCR data does not block core", () =>
    expect(coreReady(report)).toBe(true));
  it("unknown mandatory dependency blocks readiness", () =>
    expect(
      coreReady({
        ...report,
        dependencies: [{ ...report.dependencies[0], status: "unknown" }],
      }),
    ).toBe(false));
  it("unsupported OS blocks readiness", () =>
    expect(
      coreReady({ ...report, os: { ...report.os, supported: false } }),
    ).toBe(false));
});
describe("honest progress and hardware values", () => {
  it("unknown capacity does not display as zero", () => {
    expect(formatBytes(null)).toBe("Chưa xác định");
    expect(formatBytes(0)).toBe("0 B");
  });
  it("clamps malformed progress", () => {
    expect(safePercent(NaN)).toBe(0);
    expect(safePercent(150)).toBe(100);
  });
  it("terminal and cancelled jobs release UI controls", () => {
    for (const stage of ["completed", "cancelled", "failed"] as const)
      expect(jobRunning({ stage } as JobProgress)).toBe(false);
    expect(jobRunning({ stage: "verifying" } as JobProgress)).toBe(true);
  });
});
