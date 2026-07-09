import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export function useImageUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const uploadImage = async (file, vendorId) => {
        try {
            setUploading(true);
            setError(null);
            setProgress(0);

            // Validate file
            if (!file) {
                throw new Error('No file selected');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF)');
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                throw new Error('File size too large. Maximum size is 5MB');
            }

            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${vendorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            setProgress(100);
            return publicUrl;

        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const deleteImage = async (imageUrl) => {
        try {
            // Extract file path from URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const vendorId = urlParts[urlParts.length - 2];

            const filePath = `${vendorId}/${fileName}`;

            const { error } = await supabase.storage
                .from('product-images')
                .remove([filePath]);

            if (error) throw error;

            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        uploadImage,
        deleteImage,
        uploading,
        progress,
        error
    };
}