import { createClient } from './supabase/client'

export async function uploadReceipt(file: File): Promise<string> {
  const supabase = createClient()
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function deleteReceipt(imageUrl: string): Promise<void> {
  const supabase = createClient()
  
  // Extract filename from URL
  const fileName = imageUrl.split('/').pop()
  if (!fileName) {
    throw new Error('Invalid image URL')
  }

  const { error } = await supabase.storage
    .from('receipts')
    .remove([fileName])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

export function getReceiptUrl(imageUrl: string): string {
  const supabase = createClient()
  
  // Extract filename from URL
  const fileName = imageUrl.split('/').pop()
  if (!fileName) {
    return imageUrl // Return original URL if we can't parse it
  }

  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function getSignedReceiptUrl(imageUrl: string): Promise<string> {
  const supabase = createClient()
  
  // Extract filename from URL
  const fileName = imageUrl.split('/').pop()
  if (!fileName) {
    throw new Error('Invalid image URL')
  }

  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(fileName, 3600) // 1 hour expiry

  if (error) {
    throw new Error(`Error creating signed URL: ${error.message}`)
  }

  return data.signedUrl
}
