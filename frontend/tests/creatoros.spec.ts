import { test, expect } from '@playwright/test';

test.describe('CreatorOS Feature Tests', () => {
  test('should load the dashboard and verify key components', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('http://localhost:7070');
    
    // 2. Wait for the layout and sidebar
    await expect(page.locator('text=CreatorOS').first()).toBeVisible();
    await expect(page.locator('text=Command Center').first()).toBeVisible();

    // 3. Check Dashboard Stats
    await page.click('text=Dashboard');
    await expect(page.locator('text=Total Views')).toBeVisible();
    await expect(page.locator('text=Subscribers')).toBeVisible();
    await expect(page.locator('text=Total Likes')).toBeVisible();
    
    // 4. Check Analytics Page
    await page.click('text=Analytics');
    await expect(page.locator('text=Advanced Analytics')).toBeVisible();
    
    // 5. Check Home Page (Top Performing Content)
    await page.click('text=Home');
    await expect(page.locator('text=Home - Top Performing Content')).toBeVisible();
    
    // 6. Test the Command Center Dropdown
    const dropdown = page.locator('select');
    await dropdown.selectOption('all');
    
    // Ensure that it doesn't crash and we can see videos
    await page.waitForTimeout(2000);
    const videos = await page.locator('.glass-card').count();
    console.log(`Found ${videos} top performing videos on Home.`);
  });
});
