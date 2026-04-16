let counter = 100;

export function generateCppNumber(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  counter++;
  return `SC/${dd}${mm}${yy}/${String(counter).padStart(6, "0")}`;
}
