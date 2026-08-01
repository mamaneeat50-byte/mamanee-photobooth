const crypto = require('crypto');

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
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary env vars missing' }) };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'mamanee-photobooth';

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const form = new URLSearchParams();
    form.append('file', dataURL);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);

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
