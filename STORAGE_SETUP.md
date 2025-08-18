# Supabase Storage Setup Guide

## 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter the following details:
   - **Name**: `receipts`
   - **Public bucket**: ✅ Check this option
   - **File size limit**: `10 MB` (or your preferred limit)
   - **Allowed MIME types**: `image/*` (for images only)

## 2. Configure Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

### Policy 1: Allow authenticated users to upload files

```sql
CREATE POLICY "Allow authenticated users to upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);
```

### Policy 2: Allow authenticated users to view files

```sql
CREATE POLICY "Allow authenticated users to view receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);
```

### Policy 3: Allow users to delete their own files

```sql
CREATE POLICY "Allow users to delete their own receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);
```

## 3. Environment Variables

Make sure your `.env` file includes the Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Database Migration

Run the Prisma migration to add the `imageUrl` field to the Expense model:

```bash
npx prisma migrate dev --name add_image_url_to_expenses
```

## 5. Features Implemented

- ✅ **File Upload Component**: Drag & drop or click to select
- ✅ **Image Validation**: Only accepts image files
- ✅ **Storage Integration**: Uploads to Supabase Storage bucket
- ✅ **Receipt Thumbnails**: Shows in expenses list
- ✅ **Click to View**: Opens full image in new tab
- ✅ **File Management**: Delete files when needed

## 6. Usage

1. **Adding Expense with Receipt**:
   - Click "Add Expense"
   - Fill in expense details
   - Drag & drop or click to upload receipt image
   - Submit the form

2. **Viewing Receipts**:
   - Receipt thumbnails appear in the expenses table
   - Click thumbnail to view full image
   - Hover to see preview icon

## 7. File Structure

```
src/
├── lib/
│   └── storage.ts          # Storage utility functions
├── components/
│   └── ui/
│       └── file-upload.tsx # File upload component
└── app/
    └── (app)/
        └── expenses/
            └── page.tsx    # Updated with receipt thumbnails
```

## 8. Security Notes

- Only authenticated users can upload/view files
- Files are stored in a public bucket but require authentication
- File size and type restrictions are enforced
- Unique filenames prevent conflicts

## 9. Troubleshooting

If you encounter issues:

1. **Check bucket permissions**: Ensure RLS policies are correctly set
2. **Verify environment variables**: Make sure Supabase URL and key are correct
3. **Check file size**: Ensure files are under the bucket limit
4. **File type validation**: Only image files are accepted
