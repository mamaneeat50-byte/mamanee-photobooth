const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) {
    return { statusCode: 400, body: 'Missing key' };
  }

  try {
    const store = getStore({
      name: 'photos',
      consistency: 'strong',
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN
    });
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });

    if (!result) {
      return { statusCode: 404, body: 'Photo not found (it may have expired or the link is wrong)' };
    }

    const { data, metadata } = result;
    const contentType = (metadata && metadata.contentType) || 'image/jpeg';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline; filename="mamanee-photo-booth.jpg"'
      },
      body: Buffer.from(data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('get-photo error', err);
    return { statusCode: 500, body: 'Failed to retrieve photo' };
  }
};
