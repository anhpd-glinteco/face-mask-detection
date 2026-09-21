import "@testing-library/jest-dom/vitest";

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: (file: File) => `blob:${file.name}`,
});
Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: () => undefined });
