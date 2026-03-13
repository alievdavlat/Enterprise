export default async () => {
  const server = await import("./server");
  return server;
};
