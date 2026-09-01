import { readFile } from "node:fs/promises";

const inventoryUrls = [
  new URL("../data/drive-inventory.json", import.meta.url),
  new URL("../data/grade-10-drive-inventory.json", import.meta.url),
];

export async function loadInventory() {
  const inventories = await Promise.all(inventoryUrls.map(async (url) => JSON.parse(await readFile(url, "utf8"))));
  const files = inventories.flatMap((inventory) => inventory.files);
  const ids = new Set(files.map((file) => file.id));
  if (ids.size !== files.length) throw new Error(`Duplicate Drive IDs detected: ${files.length - ids.size}`);
  return { files, inventories };
}
