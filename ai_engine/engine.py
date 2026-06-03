import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import os
import time
import mysql.connector

class PhotoSortingEngine:
    # 1. UPGRADE: Expanded AI Vision to catch small background faces
    def __init__(self, ctx_id=-1, det_size=(1280, 1280)): 
        self.app = FaceAnalysis(name='buffalo_l', root='.')
        self.app.prepare(ctx_id=ctx_id, det_size=det_size)

    def calculate_similarity(self, feat1, feat2):
        return np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2))

    def create_child_profile(self, sample_image_paths):
        embeddings = []
        for img_path in sample_image_paths:
            img = cv2.imread(img_path)
            if img is None:
                continue
            
            faces = self.app.get(img)
            if len(faces) > 0:
                faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]), reverse=True)
                embeddings.append(faces[0].normed_embedding)
        
        if not embeddings:
            raise ValueError("Could not extract any valid face embeddings from sample images.")
        return np.mean(embeddings, axis=0)

    def process_single_image(self, input_image_path, target_embedding, threshold=0.45):
        img = cv2.imread(input_image_path)
        if img is None:
            return False, 0.0, None
            
        output_img = img.copy()
        faces = self.app.get(img)
        
        target_found = False
        highest_score = 0.0
        
        for face in faces:
            sim = self.calculate_similarity(target_embedding, face.normed_embedding)
            confidence_percentage = max(0.0, min(100.0, (sim + 0.2) / 1.2 * 100))
            
            if sim >= threshold:
                target_found = True
                if confidence_percentage > highest_score:
                    highest_score = confidence_percentage
            else:
                bbox = face.bbox.astype(int)
                x1 = max(0, bbox[0])
                y1 = max(0, bbox[1])
                x2 = min(img.shape[1], bbox[2])
                y2 = min(img.shape[0], bbox[3])
                
                face_region = output_img[y1:y2, x1:x2]
                if face_region.size > 0:
                    fh, fw = face_region.shape[:2]
                    # 2. UPGRADE: Dynamic blur kernel that scales perfectly with the face size
                    kw = max(11, (fw // 2) | 1)
                    kh = max(11, (fh // 2) | 1)
                    blurred_face = cv2.GaussianBlur(face_region, (kw, kh), 30)
                    output_img[y1:y2, x1:x2] = blurred_face
                    
        return target_found, highest_score, output_img

    def process_batch(self, input_folder, output_folder, target_embedding, threshold=0.45):
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            
        valid_exts = ('.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG')
        batch_results = []
        
        for filename in os.listdir(input_folder):
            if filename.endswith(valid_exts):
                input_path = os.path.join(input_folder, filename)
                output_path = os.path.join(output_folder, filename)
                
                matched, score, processed_img = self.process_single_image(input_path, target_embedding, threshold)
                
                if processed_img is not None:
                    if matched:
                        # 3. UPGRADE: Catch OpenCV's silent failure!
                        success = cv2.imwrite(output_path, processed_img)
                        if success:
                            print(f"🎯 Target Found & Saved: {filename} ({score:.1f}%)")
                        else:
                            print(f"❌ PERMISSION DENIED: OpenCV could not overwrite {filename}")
                    else:
                        print(f"⏭️ Skipped (Target Not Present): {filename}")
                    
                    batch_results.append({
                        "filename": filename,
                        "matched": matched,
                        "confidence": round(score, 2)
                    })
                    
        return batch_results

def connect_to_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="", 
        database="photosort"
    )

if __name__ == "__main__":
    print("🤖 AI Engine starting... Loading InsightFace Models...")
    engine = PhotoSortingEngine(ctx_id=-1) 
    print("✅ Engine Ready. Listening for new jobs...")

    while True:
        try:
            db = connect_to_db()
            cursor = db.cursor(dictionary=True)
            
            cursor.execute("SELECT * FROM projects WHERE status = 'Processing' LIMIT 1")
            project = cursor.fetchone()
            
            if project:
                project_id = project['id']
                profile_id = project['profile_id']
                print(f"\n🔔 New Project Found! ID: {project_id}")
                
                base_dir = f"/opt/lampp/htdocs/photosort/uploads/children/child_{profile_id}/project_{project_id}"
                samples_dir = f"{base_dir}/samples"
                source_dir = f"{base_dir}/source"
                
                sample_photos = []
                if os.path.exists(samples_dir):
                    valid_exts = ('.jpg', '.png', '.jpeg', '.JPG', '.PNG', '.JPEG')
                    for f in os.listdir(samples_dir):
                        if f.endswith(valid_exts):
                            sample_photos.append(os.path.join(samples_dir, f))
                
                if not sample_photos:
                    print("❌ No sample photos found. Marking as Failed.")
                    cursor.execute("UPDATE projects SET status = 'Failed' WHERE id = %s", (project_id,))
                    db.commit()
                    continue

                try:
                    print("✨ Generating target profile vectors...")
                    target_profile = engine.create_child_profile(sample_photos)
                    
                    print(f"🚀 Running Exclusive Batch Filtration on project {project_id}...")
                    results = engine.process_batch(source_dir, source_dir, target_profile) 
                    
                    matched_count = 0
                    
                    for res in results:
                        if res['matched']:
                            matched_count += 1
                            cursor.execute(
                                "INSERT INTO project_photos (project_id, filename, confidence_score, review_status) VALUES (%s, %s, %s, 'pending')",
                                (project_id, res['filename'], float(res['confidence'])) 
                            )
                    
                    cursor.execute(
                        "UPDATE projects SET status = 'In Review', matched_photos = %s WHERE id = %s",
                        (matched_count, project_id)
                    )
                    db.commit()
                    print(f"✅ Project {project_id} complete! Waiting for admin review.")
                    
                except Exception as e:
                    print(f"❌ AI Processing Error: {e}")
                    cursor.execute("UPDATE projects SET status = 'Failed' WHERE id = %s", (project_id,))
                    db.commit()

            cursor.close()
            db.close()
            
        except mysql.connector.Error as err:
            print(f"⚠️ Database connection error: {err}")
            
        time.sleep(3)