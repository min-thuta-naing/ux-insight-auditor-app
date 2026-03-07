/**
 * Cloudinary Service for Image Uploads
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a base64 image string to Cloudinary
 * @param base64Image The full data URL (e.g., data:image/png;base64,...)
 * @returns The secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (base64Image: string): Promise<string> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Cloudinary configuration missing in .env.local");
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    // Prepare form data for unsigned upload
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cloudinary Upload Error Details:", errorData);
            throw new Error(errorData.error?.message || "Cloudinary upload failed");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload error:", error);
        throw error;
    }
};
