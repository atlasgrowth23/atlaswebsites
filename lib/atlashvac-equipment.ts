// AtlasHVAC Equipment database operations and file upload utilities

import { createClient } from '@supabase/supabase-js';
import { Equipment, EquipmentPhoto, EquipmentFormData } from '@/types/atlashvac';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Storage bucket name for equipment photos
const EQUIPMENT_PHOTOS_BUCKET = 'atlashvac-equipment-photos';

/**
 * Fetch all equipment for a specific contact
 */
export async function fetchEquipment(tenantId: string, contactId: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('atlashvac_equipment')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching equipment:', error);
    throw new Error('Failed to fetch equipment');
  }

  return data || [];
}

/**
 * Save new equipment or update existing
 */
export async function saveEquipment(
  formData: EquipmentFormData,
  tenantId: string,
  contactId: string,
  equipmentId?: string
): Promise<Equipment> {
  const equipmentData = {
    tenant_id: tenantId,
    contact_id: contactId,
    ...formData,
    // Convert empty strings to null for date fields
    install_date: formData.install_date || null,
    warranty_ends: formData.warranty_ends || null,
  };

  let query;
  if (equipmentId) {
    // Update existing equipment
    query = supabase
      .from('atlashvac_equipment')
      .update(equipmentData)
      .eq('id', equipmentId)
      .eq('tenant_id', tenantId) // Security: ensure tenant isolation
      .select()
      .single();
  } else {
    // Create new equipment
    query = supabase
      .from('atlashvac_equipment')
      .insert(equipmentData)
      .select()
      .single();
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error saving equipment:', error);
    throw new Error('Failed to save equipment');
  }

  return data;
}

/**
 * Delete equipment and all associated photos
 */
export async function deleteEquipment(equipmentId: string, tenantId: string): Promise<void> {
  // First delete all photos from storage and database
  const photos = await fetchEquipmentPhotos(equipmentId, tenantId);
  
  for (const photo of photos) {
    await deleteEquipmentPhoto(photo.id, tenantId);
  }

  // Then delete the equipment record
  const { error } = await supabase
    .from('atlashvac_equipment')
    .delete()
    .eq('id', equipmentId)
    .eq('tenant_id', tenantId); // Security: ensure tenant isolation

  if (error) {
    console.error('Error deleting equipment:', error);
    throw new Error('Failed to delete equipment');
  }
}

/**
 * Fetch photos for specific equipment
 */
export async function fetchEquipmentPhotos(equipmentId: string, tenantId: string): Promise<EquipmentPhoto[]> {
  const { data, error } = await supabase
    .from('atlashvac_equipment_photos')
    .select('*')
    .eq('equipment_id', equipmentId)
    .eq('tenant_id', tenantId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching equipment photos:', error);
    throw new Error('Failed to fetch equipment photos');
  }

  return data || [];
}

/**
 * Upload photo to Supabase Storage and save record to database
 */
export async function uploadEquipmentPhoto(
  file: File,
  equipmentId: string,
  tenantId: string
): Promise<EquipmentPhoto> {
  try {
    // Generate unique filename: tenant_equipment_timestamp_original
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}/${equipmentId}/${timestamp}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(EQUIPMENT_PHOTOS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      throw new Error('Failed to upload photo');
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(EQUIPMENT_PHOTOS_BUCKET)
      .getPublicUrl(fileName);

    // Save photo record to database
    const { data, error } = await supabase
      .from('atlashvac_equipment_photos')
      .insert({
        tenant_id: tenantId,
        equipment_id: equipmentId,
        photo_url: publicUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving photo record:', error);
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from(EQUIPMENT_PHOTOS_BUCKET)
        .remove([fileName]);
      throw new Error('Failed to save photo record');
    }

    return data;
  } catch (error) {
    console.error('Error in uploadEquipmentPhoto:', error);
    throw error;
  }
}

/**
 * Delete photo from storage and database
 */
export async function deleteEquipmentPhoto(photoId: string, tenantId: string): Promise<void> {
  // First get the photo record to extract the file path
  const { data: photo, error: fetchError } = await supabase
    .from('atlashvac_equipment_photos')
    .select('photo_url')
    .eq('id', photoId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError) {
    console.error('Error fetching photo for deletion:', fetchError);
    throw new Error('Failed to find photo');
  }

  // Extract file path from URL for storage deletion
  const urlParts = photo.photo_url.split('/');
  const bucketIndex = urlParts.findIndex(part => part === EQUIPMENT_PHOTOS_BUCKET);
  const filePath = urlParts.slice(bucketIndex + 1).join('/');

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(EQUIPMENT_PHOTOS_BUCKET)
    .remove([filePath]);

  if (storageError) {
    console.error('Error deleting from storage:', storageError);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('atlashvac_equipment_photos')
    .delete()
    .eq('id', photoId)
    .eq('tenant_id', tenantId);

  if (dbError) {
    console.error('Error deleting photo record:', dbError);
    throw new Error('Failed to delete photo record');
  }
}

/**
 * Validate file for photo upload
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be a JPEG, PNG, or WebP image' };
  }

  return { valid: true };
}