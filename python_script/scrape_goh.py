
# scrape_goh.py
from bs4 import BeautifulSoup
import requests
import json

BASE_URL = "https://giftofhealth.org"
pages = [ "/",
    "/6wks_online_course",
    "/blog",
    "/contact-us",
    "/appointment-page",
    "/f-a-qs",
    "/nutrition-labels",
    "/recipes",
    "/eat-to-lower-cholesterol","/who-we-are","/our-mission","/success-stories","/givegiftofhealth","/eventlist","/cucumber-chickpea-salad"]
data = []

for page in pages:
    url = BASE_URL + page
    res = requests.get(url)
    soup = BeautifulSoup(res.text, "html.parser")

    text = " ".join(p.get_text() for p in soup.find_all("p"))
    data.append({"url": url, "content": text.strip()})

with open("goh_content.json", "w") as f:
    json.dump(data, f, indent=2)
# output = []

# for path in pages:
#     url = BASE_URL + path
#     try:
#         print(f"Scraping {url}...")
#         r = requests.get(url, timeout=10)
#         soup = BeautifulSoup(r.text, "html.parser")

#         # Remove unwanted tags
#         for tag in soup(["script", "style", "nav", "footer"]):
#             tag.decompose()

#         text = " ".join(soup.stripped_strings)
#         output.append({
#             "url": url,
#             "content": text
#         })
#     except Exception as e:
#         print(f"⚠️ Error scraping {url}: {e}")

# with open("goh_content.json", "w", encoding="utf-8") as f:
#     json.dump(output, f, indent=2)

print("✅ Scraped data saved to goh_content.json")