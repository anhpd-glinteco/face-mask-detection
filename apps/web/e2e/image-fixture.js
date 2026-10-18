// Generate an image in the browser; no face media or image library is needed.
export async function uploadImage(page) {
  await page.locator('#image-input').evaluate(async input => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext('2d');
    context.fillStyle = '#385';
    context.fillRect(0, 0, 320, 240);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const files = new DataTransfer();
    files.items.add(new File([blob], 'fixture.png', { type: 'image/png' }));
    input.files = files.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
