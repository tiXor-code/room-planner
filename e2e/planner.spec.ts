import { expect, test, type Page } from '@playwright/test';

/** The current Plan model, via the app's test hook. */
async function model(page: Page): Promise<any> {
  return page.evaluate(() => (window as unknown as { __planner?: () => unknown }).__planner?.());
}

test('add a room, edit its metric size, add furniture, and persist across reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { __planner?: unknown }).__planner);

  // add a room
  await page.getByTestId('add-room').click();
  await expect.poll(async () => (await model(page)).rooms.length).toBe(1);

  // set its width to 5.00 m via the properties panel (stored as cm)
  const width = page.getByTestId('field-width');
  await width.fill('500');
  await width.blur();
  await expect.poll(async () => (await model(page)).rooms[0].w).toBe(500);
  await expect(page.getByTestId('room-area')).toContainText('m²');

  // add two furniture boxes
  await page.getByTestId('add-furniture').click();
  await page.getByTestId('add-furniture').click();
  await expect.poll(async () => (await model(page)).furniture.length).toBe(2);

  // let debounced autosave flush, then reload -> localStorage persistence
  await page.waitForTimeout(800);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __planner?: unknown }).__planner);
  await expect
    .poll(async () => {
      const m = await model(page);
      return [m.rooms.length, m.rooms[0]?.w, m.furniture.length];
    })
    .toEqual([1, 500, 2]);
});

test('measure tool records a real metric distance', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { __planner?: unknown }).__planner);
  await page.getByTestId('add-room').click();
  await page.getByTestId('tool-measure').click();
  const canvas = page.locator('canvas').first();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + 200, box.y + 200);
  await page.mouse.click(box.x + 400, box.y + 200);
  // ~200 screen px at zoom 1 == ~200 cm == 2 m
  await expect.poll(async () => page.evaluate(() => (window as unknown as { __measure?: number }).__measure ?? 0)).toBeGreaterThan(150);
});
