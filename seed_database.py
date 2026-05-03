"""
seed_database.py - Seeds Firebase Realtime Database with professor data
Uses the Firebase Admin SDK (free tier, no billing required)
"""

import firebase_admin
from firebase_admin import credentials, db
import json


def main():
    # Load professors from scraped JSON
    try:
        with open("professors.json", "r", encoding="utf-8") as f:
            professors = json.load(f)
    except FileNotFoundError:
        print("[!] professors.json not found. Run scraper.py first.")
        return

    print(f"[*] Loaded {len(professors)} professors from professors.json")

    # Initialize Firebase Admin SDK
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            "databaseURL": "https://rate-numl-default-rtdb.firebaseio.com"
        })
    except FileNotFoundError:
        print("[!] serviceAccountKey.json not found.")
        print("    Download it from Firebase Console:")
        print("    Project Settings -> Service accounts -> Generate new private key")
        return

    print("[*] Connected to Firebase Realtime Database")

    # Reference to /professors node
    professors_ref = db.reference("professors")

    # Clear existing data
    print("[*] Clearing existing professor data...")
    professors_ref.delete()

    # Seed professors with auto-generated keys
    print("[*] Seeding professors...")
    count = 0
    for prof in professors:
        professors_ref.push({
            "name": prof["name"],
            "department": prof["department"],
            "designation": prof.get("designation", "Faculty Member"),
            "imageUrl": prof.get("imageUrl", ""),
            "profileUrl": prof.get("profileUrl", ""),
            "averageRating": 0,
            "totalReviews": 0,
        })
        count += 1
        if count % 50 == 0:
            print(f"  [*] Seeded {count}/{len(professors)}...")

    print(f"\n[OK] Successfully seeded {count} professors into Realtime Database!")

    # Set up database rules (read-only for professors, write reviews anonymously)
    print("\n[!] IMPORTANT: Set these Realtime Database Rules in Firebase Console:")
    print('    Database -> Rules tab -> paste the following:\n')
    print('''{
  "rules": {
    "professors": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["department", "name"]
    },
    "reviews": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["professorId"]
    }
  }
}''')


if __name__ == "__main__":
    main()
