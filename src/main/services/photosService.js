/* eslint-disable prettier/prettier */
// Photos Service - Cloudinary cloud storage
import { ipcMain, BrowserWindow } from 'electron';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Local backup path (optional)
const photosPath = path.resolve(__dirname, '../../data/photos');
if (!fs.existsSync(photosPath)) {
  fs.mkdirSync(photosPath, { recursive: true });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function restoreFocus() {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    const mainWindow = windows[0];
    setTimeout(() => {
      mainWindow.focus();
      mainWindow.webContents.focus();
    }, 50);
  }
}

// ============================================
// IPC HANDLERS - PHOTOS (CLOUDINARY)
// ============================================

/**
 * Save photo to Cloudinary and database
 */
ipcMain.handle('photos:save', async (event, { id, photoData, extension }) => {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(photoData, 'base64');
    
    // Optional: Save local backup
    const localPath = path.join(photosPath, `${id}.${extension}`);
    fs.writeFileSync(localPath, buffer);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'student-photos',
          public_id: `student_${id}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
            { quality: 'auto:good' }, // Auto optimize quality
            { fetch_format: 'auto' } // Auto format (WebP for modern browsers)
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Generate thumbnail URL (200x200)
    const thumbnailUrl = cloudinary.url(`student-photos/student_${id}`, {
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto:low',
      fetch_format: 'auto'
    });

    // Save photo URL to database
    try {
      await pool.query(
        'UPDATE master_database SET photo_url = $1 WHERE student_id = $2',
        [result.secure_url, id]
      );
      console.log(`✅ Saved photo URL to database for student ${id}`);
    } catch (dbError) {
      console.error('Error saving photo URL to database:', dbError);
      // Continue even if database update fails
    }

    console.log(`✅ Saved photo for student ID ${id} to Cloudinary`);
    restoreFocus();

    return {
      success: true,
      message: 'Photo saved successfully',
      url: result.secure_url,
      thumbnail: thumbnailUrl,
      cloudinary_id: result.public_id
    };
  } catch (err) {
    console.error('Error saving photo:', err);
    restoreFocus();
    return { success: false, error: err.message };
  }
});

/**
 * Check if photo exists in Cloudinary
 */
ipcMain.handle('photos:exists', async (event, id) => {
  try {
    // First check database
    const dbResult = await pool.query(
      'SELECT photo_url FROM master_database WHERE student_id = $1',
      [id]
    );

    if (dbResult.rows.length > 0 && dbResult.rows[0].photo_url) {
      const photoUrl = dbResult.rows[0].photo_url;
      const thumbnail = cloudinary.url(`student-photos/student_${id}`, {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto:low',
        fetch_format: 'auto'
      });

      return {
        success: true,
        exists: true,
        path: photoUrl,
        thumbnail
      };
    }

    // If not in database, check Cloudinary directly
    const publicId = `student-photos/student_${id}`;
    
    try {
      await cloudinary.api.resource(publicId);

      const url = cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto'
      });

      const thumbnail = cloudinary.url(publicId, {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto:low',
        fetch_format: 'auto'
      });

      // Update database with found URL
      await pool.query(
        'UPDATE master_database SET photo_url = $1 WHERE student_id = $2',
        [url, id]
      );

      return {
        success: true,
        exists: true,
        path: url,
        thumbnail
      };
    } catch (cloudinaryError) {
      if (cloudinaryError.error && cloudinaryError.error.http_code === 404) {
        return { success: true, exists: false };
      }
      throw cloudinaryError;
    }
  } catch (err) {
    console.error('Error checking photo existence:', err);
    return { success: false, error: err.message, exists: false };
  }
});

/**
 * Get photo URL from Cloudinary
 */
ipcMain.handle('photos:getPath', async (event, id) => {
  try {
    // First check database
    const dbResult = await pool.query(
      'SELECT photo_url FROM master_database WHERE student_id = $1',
      [id]
    );

    if (dbResult.rows.length > 0 && dbResult.rows[0].photo_url) {
      const photoUrl = dbResult.rows[0].photo_url;
      const thumbnail = cloudinary.url(`student-photos/student_${id}`, {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto:low',
        fetch_format: 'auto'
      });

      return {
        success: true,
        path: photoUrl,
        thumbnail
      };
    }

    // If not in database, generate from Cloudinary
    const publicId = `student-photos/student_${id}`;

    const url = cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto:good'
    });

    const thumbnail = cloudinary.url(publicId, {
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto:low',
      fetch_format: 'auto'
    });

    return {
      success: true,
      path: url,
      thumbnail
    };
  } catch (err) {
    console.error('Error getting photo path:', err);
    return { success: false, error: err.message, path: null };
  }
});

/**
 * Delete photo from Cloudinary and database
 */
ipcMain.handle('photos:delete', async (event, id) => {
  try {
    const publicId = `student-photos/student_${id}`;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Delete from database
    await pool.query(
      'UPDATE master_database SET photo_url = NULL WHERE student_id = $1',
      [id]
    );

    // Optional: Delete local backup
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    for (const ext of extensions) {
      const localPath = path.join(photosPath, `${id}.${ext}`);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    console.log(`✅ Deleted photo for student ID ${id}`);

    return { success: true, message: 'Photo deleted successfully' };
  } catch (err) {
    console.error('Error deleting photo:', err);
    return { success: false, error: err.message };
  }
});

/**
 * Migrate local photos to Cloudinary
 * Run this once to migrate existing photos
 */
ipcMain.handle('photos:migrateToCloudinary', async () => {
  try {
    if (!fs.existsSync(photosPath)) {
      return { success: false, error: 'Photos directory not found' };
    }

    const files = fs.readdirSync(photosPath);
    let migrated = 0;
    let errors = 0;

    console.log(`📤 Starting migration of ${files.length} photos to Cloudinary...`);

    for (const file of files) {
      try {
        // Extract student ID from filename (e.g., "123.jpg" -> "123")
        const studentId = path.parse(file).name;
        const filePath = path.join(photosPath, file);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'student-photos',
          public_id: `student_${studentId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });

        // Save to database
        await pool.query(
          'UPDATE master_database SET photo_url = $1 WHERE student_id = $2',
          [result.secure_url, studentId]
        );

        migrated++;
        console.log(`✅ Migrated photo for student ${studentId}`);
      } catch (err) {
        errors++;
        console.error(`❌ Error migrating ${file}:`, err.message);
      }
    }

    console.log(`✅ Migration complete: ${migrated} migrated, ${errors} errors`);

    return {
      success: true,
      message: `Migrated ${migrated} photos to Cloudinary`,
      migrated,
      errors,
      total: files.length
    };
  } catch (err) {
    console.error('Error migrating photos:', err);
    return { success: false, error: err.message };
  }
});

console.log('✅ Photos Service initialized (Cloudinary)');
console.log(`☁️  Cloud: ${process.env.CLOUDINARY_CLOUD_NAME || 'Not configured'}`);
console.log(`📁 Local backup: ${photosPath}`);

export { pool };