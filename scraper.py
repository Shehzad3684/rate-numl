"""
scraper.py - Scrapes ALL NUML department faculty pages and outputs professors.json
Extracts: name, department, designation, profile photo URL, profile page URL
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time

# All NUML Islamabad departments (Dept ID -> Dept Name)
DEPARTMENTS = {
    # Faculty of Engineering and Computing
    178: "Computer Science",
    179: "Electrical and Computer Engineering",
    195: "Mathematics",
    273: "Software Engineering",
    # Faculty of Languages
    193: "Arabic",
    187: "Chinese",
    191: "English Language Teaching (ELT)",
    194: "French",
    180: "German",
    262: "Italian",
    185: "Japanese",
    188: "Korean Language & Culture",
    181: "Pakistani Languages",
    189: "Persian",
    183: "Russian",
    192: "South Asian Languages",
    184: "Spanish",
    245: "Translation & Interpretation",
    186: "Turkish Studies",
    182: "Urdu",
    # Faculty of Management Sciences
    340: "Accounting and Finance",
    198: "Economics",
    196: "Management Science",
    # Faculty of Social Sciences
    199: "Applied Psychology",
    172: "Educational Sciences",
    197: "Governance & Public Policy",
    173: "International Relations",
    177: "Islamic Thought and Culture",
    175: "Media and Communication Studies",
    176: "Pakistan Studies",
    174: "Peace & Conflict Studies",
    # Faculty of Arts and Humanities
    190: "English GS",
    269: "English UGS",
}

BASE_URL = "https://www.numl.edu.pk/department/{dept_id}/faculty"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def clean_name(raw_name):
    """Remove parenthetical roles like (Head CS Department), (Dean), etc."""
    cleaned = re.sub(r'\s*\(.*?\)\s*', '', raw_name).strip()
    # Title-case names that are ALL CAPS
    if cleaned == cleaned.upper() and len(cleaned) > 3:
        cleaned = cleaned.title()
    return cleaned


def scrape_department(dept_id, dept_name):
    """Scrape a single department's faculty page."""
    url = BASE_URL.format(dept_id=dept_id)
    print(f"  [*] Scraping {dept_name} (ID: {dept_id})...")

    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  [!] Failed to fetch {url}: {e}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    professors = []
    seen_names = set()

    # Each faculty member is in a div.courses-wrap
    faculty_cards = soup.find_all("div", class_="courses-wrap")

    for card in faculty_cards:
        # Extract image URL
        img_tag = card.select_one("div.thumb.f-thumb img, div.thumb img")
        image_url = ""
        if img_tag and img_tag.get("src"):
            image_url = img_tag["src"]
            # Fix double slash if present
            if image_url.startswith("https://numl.edu.pk//"):
                image_url = image_url.replace("numl.edu.pk//", "numl.edu.pk/")
            # Ensure absolute URL
            if image_url.startswith("/"):
                image_url = "https://www.numl.edu.pk" + image_url

        # Extract name and profile link
        name_tag = card.select_one("h3.instructorName a")
        if not name_tag:
            continue

        raw_name = name_tag.get_text(strip=True)
        if not raw_name:
            continue

        name = clean_name(raw_name)
        if name in seen_names:
            continue
        seen_names.add(name)

        profile_url = name_tag.get("href", "")
        if profile_url and not profile_url.startswith("http"):
            profile_url = "https://www.numl.edu.pk" + profile_url

        # Extract designation
        designation_tag = card.select_one("p.course-instructor")
        designation = designation_tag.get_text(strip=True) if designation_tag else "Faculty Member"

        professors.append({
            "name": name,
            "department": dept_name,
            "designation": designation,
            "imageUrl": image_url,
            "profileUrl": profile_url,
        })

    return professors


def main():
    print("[*] Rate NUML - Full University Faculty Scraper")
    print(f"[*] Scraping {len(DEPARTMENTS)} departments...\n")

    all_professors = []
    failed_departments = []

    for dept_id, dept_name in DEPARTMENTS.items():
        profs = scrape_department(dept_id, dept_name)
        if profs:
            all_professors.extend(profs)
            print(f"  [OK] Found {len(profs)} faculty members in {dept_name}")
        else:
            failed_departments.append(dept_name)
            print(f"  [!!] No faculty found for {dept_name}")

        # Be polite to the server
        time.sleep(0.5)

    # Deduplicate by name (some professors may appear in multiple departments)
    unique_profs = {}
    for prof in all_professors:
        key = prof["name"].lower().strip()
        if key not in unique_profs:
            unique_profs[key] = prof
        else:
            # Keep the one with an image
            if prof["imageUrl"] and not unique_profs[key]["imageUrl"]:
                unique_profs[key] = prof

    final_professors = list(unique_profs.values())

    # Save to JSON
    output_file = "professors.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_professors, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"[OK] Saved {len(final_professors)} unique professors to {output_file}")
    print(f"[*]  Departments scraped: {len(DEPARTMENTS) - len(failed_departments)}/{len(DEPARTMENTS)}")
    if failed_departments:
        print(f"[!!] Failed departments: {', '.join(failed_departments)}")
    print(f"{'='*60}")

    # Print summary by department
    dept_counts = {}
    for p in final_professors:
        dept_counts[p["department"]] = dept_counts.get(p["department"], 0) + 1
    print("\nBreakdown by department:")
    for dept, count in sorted(dept_counts.items()):
        print(f"  {dept}: {count}")


if __name__ == "__main__":
    main()
