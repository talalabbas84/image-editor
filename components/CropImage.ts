export const getCroppedImg = (imageSrc, crop) => {
  const image = new Image();
  image.src = imageSrc;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const { width, height } = crop;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        // Handle error
        console.error('Canvas is empty');
        return;
      }
      const fileUrl = window.URL.createObjectURL(blob);
      resolve(fileUrl);
    }, 'image/jpeg');
  });
};
