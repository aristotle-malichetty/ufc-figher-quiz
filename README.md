# UFC Fighter Quiz

Find your UFC alter ego! Take a 5-question quiz to discover which UFC fighter matches your fighting style.

**Live Demo:** [ufc.aristotle.me](https://ufc.aristotle.me)

## Features

- **Personality Quiz** - Answer 5 questions about your fighting preferences
- **Smart Matching** - Algorithm matches your style to real UFC fighters using weighted scoring with randomization for variety
- **Shareable Results** - Dynamic landing pages so friends can see your fighter match
- **Live Stats** - See how many others got the same fighter as you

## How It Works

1. Each question has options mapped to fighting styles (striker, grappler, balanced, etc.)
2. Your answers build a style profile with weighted scores
3. The algorithm finds UFC fighters whose stats match your style
4. Results include a randomization factor so same answers can yield different (but similar) fighters

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite |
| Backend | Cloudflare Workers |
| Storage | Cloudflare KV |
| Data | UFC Stats API |

## License

MIT

---

Built with love for UFC by Aristotle
