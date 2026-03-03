/* 
  ☁️ CLOUDINARY SERVICE
  Uses the Cloudinary Unsigned Upload API via standard fetch.
  Perfect for lightweight frontend image/video uploads.
*/

const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
};

export const cloudinaryService = {
    /**
     * Upload an image file to Cloudinary
     * @param file The file object (from an input or blob)
     * @param folder Optional folder name in Cloudinary
     */
    async uploadImage(file: File | Blob, folder: string = 'ujjwalhub_uploads'): Promise<any> {
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
            console.warn("⚠️ Cloudinary Config missing. Check your .env file.");
            return { secure_url: null, error: "Config missing" };
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('folder', folder);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Cloudinary Error: ${response.status} - ${err}`);
            }

            return await response.json();
        } catch (error) {
            console.error("❌ Cloudinary Upload Error:", error);
            return { secure_url: null, error };
        }
    }
};
