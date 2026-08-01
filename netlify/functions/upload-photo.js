exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { dataURL } = JSON.parse(event.body);
    if (!dataURL) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing dataURL' }) };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary env vars missing' }) };
    }

    const form = new URLSearchParams();
    form.append('file', dataURL);
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'mamanee-photobooth');

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });

    const result = await uploadRes.json();

    if (!uploadRes.ok) {
      return { statusCode: uploadRes.status, body: JSON.stringify({ error: result.error?.message || 'Cloudinary upload failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: result.secure_url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
