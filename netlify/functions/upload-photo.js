const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { dataURL } = JSON.parse(event.body || '{}');
    if (!dataURL) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing dataURL' }) };
    }

    const match = dataURL.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid dataURL format' }) };
    }
    const [, contentType, base64] = match;
    const buffer = Buffer.from(base64, 'base64');

    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const store = getStore({ name: 'photos', consistency: 'strong' });
    await store.set(key, buffer, { metadata: { contentType } });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    };
  } catch (err) {
    console.error('upload-photo error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Upload failed', message: err.message, stack: err.stack })
    };
  }
};
