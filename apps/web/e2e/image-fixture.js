// Exercise the native file chooser instead of assigning input.files.
export async function uploadImage(page, activation = 'auto') {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    const context = canvas.getContext('2d');
    context.fillStyle = '#385'; context.fillRect(0, 0, 320, 240);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  const center = page.getByRole('button', {name: /Chọn ảnh để bắt đầu/});
  const button = activation === 'lower' || !await center.isVisible()
    ? page.getByRole('button', {name: 'Chọn ảnh', exact: true}) : center;
  const chooserPromise = page.waitForEvent('filechooser');
  if (activation === 'Enter' || activation === 'Space') {
    await button.focus();
    await button.press(activation);
  } else await button.click();
  const chooser = await chooserPromise;
  await chooser.setFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from(bytes)});
}
