import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY ვერ მოიძებნა .env ფაილში!");
}

const MODEL = "openai/gpt-oss-120b";
const BASE = "https://bookingapi.stepacademy.ge/api";

// სარეზერვო რეალური სასტუმროები შენი საიტიდან, თუ API დააგვიანებს
const DEFAULT_HOTELS = [
  { id: 10, name: "Lopota Lake Resort & Spa", city: "ყვარელი", stars: 5, price: 320 },
  { id: 9, name: "Hotel Kabadoni Sighnaghi", city: "სიღნაღი", stars: 4, price: 150 },
  { id: 8, name: "Crowne Plaza Borjomi", city: "ბორჯომი", stars: 5, price: 280 },
  { id: 7, name: "Sheraton Batumi Hotel", city: "ბათუმი", stars: 5, price: 260 },
  { id: 6, name: "Radisson Blu Hotel Batumi", city: "ბათუმი", stars: 5, price: 290 },
  { id: 5, name: "Fabrika Hostel & Suites", city: "თბილისი", stars: 3, price: 45 },
  { id: 4, name: "Sheraton Grand Tbilisi Metechi Palace", city: "თბილისი", stars: 5, price: 240 },
  { id: 3, name: "Stamba Hotel", city: "თბილისი", stars: 5, price: 210 },
  { id: 2, name: "The Biltmore Hotel Tbilisi", city: "თბილისი", stars: 5, price: 250 },
  { id: 1, name: "Rooms Hotel Tbilisi", city: "თბილისი", stars: 4, price: 110 }
];

let cache = { data: [], time: 0 };

async function getHotelsList() {
  const tenMinutes = 10 * 60 * 1000;
  if (cache.data.length > 0 && Date.now() - cache.time < tenMinutes) {
    return cache.data;
  }

  try {
    const res = await fetch(`${BASE}/hotels?Take=25&Page=1`, { headers: { accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      const items = json.items || json.data?.items || [];
      if (items.length > 0) {
        const mapped = items.map((h) => ({
          id: h.id,
          name: h.name,
          city: h.address?.city || h.city || "საქართველო",
          stars: h.starRating || 4,
          price: h.pricePerNight || (h.starRating ? h.starRating * 35 : 90)
        }));
        cache = { data: mapped, time: Date.now() };
        return mapped;
      }
    }
  } catch (err) {
    console.warn("API Fetch შეფერხდა, ვიყენებთ ნაგულისხმევ მონაცემებს");
  }

  cache = { data: DEFAULT_HOTELS, time: Date.now() };
  return DEFAULT_HOTELS;
}

app.post("/api/chat", async (req, res) => {
  const message = (req.body.message || "").trim();

  if (!message) {
    return res.status(400).json({ reply: "გთხოვთ, დაწეროთ შეკითხვა." });
  }

  try {
    const hotels = await getHotelsList();

    const now = new Date().toLocaleString("ka-GE", {
      timeZone: "Asia/Tbilisi",
      dateStyle: "full",
      timeStyle: "short",
    });

    const systemPrompt = `
შენ ხარ "STEP BOOKING"-ის ასისტენტი.
დღევანდელი დრო: ${now}
უპასუხე ყოველთვის ქართულად, უაღრესად მოკლედ და თავაზიანად (ზუსტად 1 წინადადება).

ჩვენი სასტუმროები და ფასები:
${JSON.stringify(hotels)}

მთავარი ინსტრუქცია:
- თუ მომხმარებელი გეკითხება "ყველაზე იაფ" სასტუმროზე ან ოთახზე: 
  შეადარე ფასები, დაასახელე Fabrika Hostel & Suites ($45) ან სიიდან ყველაზე დაბალფასიანი, და ბოლოში აუცილებლად დაამატე:
  HOTEL_CARD:[სასტუმროს_ID]

- თუ გეკითხება "ყველაზე ძვირზე":
  დაასახელე Lopota Lake Resort & Spa და დაამატე HOTEL_CARD:[10].

- თუ კონკრეტულ სასტუმროზე ან ქალაქზე გეკითხება:
  დაასახელე შესაბამისი და დაურთე HOTEL_CARD:[ID].

არასდროს დაწერო "ინფორმაცია ვერ მოიძებნა" — პასუხი ყოველთვის ამოიღე ზემოთ მოცემული სიიდან!
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 250,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq Error:", data);
      return res.json({ reply: "შეცდომა API-სთან კავშირისას." });
    }

    const reply = data.choices?.[0]?.message?.content || "ინფორმაცია ვერ მოიძებნა.";
    res.json({ reply });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ reply: "სერვერის შეცდომა." });
  }
});

app.listen(3000, () => console.log("AI Proxy გაეშვა: http://localhost:3000"));