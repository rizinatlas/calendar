# MMA CALENDAR data backend

`/api/events` is the public normalized-event endpoint and `/api/sources` lists the initial official promotion sources.

Production workflow:

1. One adapter per promotion fetches its official events page at a conservative rate.
2. The adapter normalizes start times to `Asia/Seoul`, extracts venue coordinates, poster URL, Fight Order image URL, and all bouts.
3. A scheduled Cloudflare Worker writes normalized records into D1; official poster and card images are cached in R2 when the source terms allow it.
4. Pages Functions serves the cached records to this UI and emits `/calendar.ics` from the same records.

Never manufacture missing posters or bouts. Store source URL and fetched-at timestamp on every event.
