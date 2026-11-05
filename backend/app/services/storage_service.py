import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

class StorageService:
    @staticmethod
    def allowed_file(filename: str) -> bool:
        if '.' not in filename:
            return False
        ext = filename.rsplit('.', 1)[1].lower()
        return ext in current_app.config['ALLOWED_EXTENSIONS']

    @classmethod
    def upload_image(cls, file_storage, folder: str = "complaints") -> str:
        """
        Uploads an image file to Supabase Storage if configured;
        otherwise saves to the local UPLOAD_FOLDER and returns a relative URL.
        """
        if not file_storage or not file_storage.filename:
            return None

        if not cls.allowed_file(file_storage.filename):
            raise ValueError("File type not allowed. Please upload PNG, JPG, JPEG, WEBP or GIF.")

        orig_filename = secure_filename(file_storage.filename)
        ext = orig_filename.rsplit('.', 1)[1].lower() if '.' in orig_filename else 'jpg'
        unique_filename = f"{folder}_{uuid.uuid4().hex[:12]}.{ext}"

        # Check if Supabase Storage is configured
        supabase_url = current_app.config.get('SUPABASE_URL')
        supabase_key = current_app.config.get('SUPABASE_SERVICE_ROLE_KEY')
        bucket_name = current_app.config.get('SUPABASE_STORAGE_BUCKET', 'complaint-images')

        if supabase_url and supabase_key:
            try:
                from supabase import create_client
                supabase = create_client(supabase_url, supabase_key)
                file_bytes = file_storage.read()
                file_storage.seek(0)
                path = f"{folder}/{unique_filename}"
                
                # Upload to Supabase bucket
                response = supabase.storage.from_(bucket_name).upload(path, file_bytes)
                # Obtain public URL or signed URL
                res = supabase.storage.from_(bucket_name).get_public_url(path)
                return res
            except Exception as e:
                current_app.logger.warning(f"Supabase upload failed ({str(e)}), falling back to local storage.")

        # Local storage fallback
        upload_dir = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_dir, exist_ok=True)
        save_path = os.path.join(upload_dir, unique_filename)
        file_storage.save(save_path)

        return f"/uploads/{unique_filename}"
