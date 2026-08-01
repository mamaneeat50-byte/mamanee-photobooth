export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/upload-photo' && request.method === 'POST') {
      try {
        const { dataURL } = await request.json();
        if (!dataURL) {
          return new Response(JSON.stringify({ error: 'Missing dataURL' }), { status: 400 });
        }

        const cloudName = env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          return new Response(JSON.stringify({ error: 'Cloudinary env vars missing' }), { status: 500 });
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
          return new Response(JSON.stringify({ error: result.error?.message || 'Cloudinary upload failed' }), { status: uploadRes.status });
        }

        return new Response(JSON.stringify({ url: result.secure_url }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Everything else: serve the static site files
    return env.ASSETS.fetch(request);
  },
};
