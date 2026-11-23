# Safe & Fine Drinking Water — delivery, cash & billing app (by PokitBio)

Mobile web app (add to home screen from Chrome) for 19L bottle delivery.

## Logins and roles
| Login (first start) | Role | Sees |
| --- | --- | --- |
| `owner` | **Owner** | Route, Customers, Payments, Bills, Dashboard, Settings, **Staff** |
| `rider` | **Rider** | Route (deliver + take cash), Customers (view + balance), **My day** |
| `pokitbio` | Super admin (PokitBio) | Everything an owner sees + PokitBio-only logins |

- First passwords come from `OWNER_PASSWORD`, `RIDER_PASSWORD`, `SUPERADMIN_PASSWORD` and are used **only once** to create the logins. After that, change them in the app.
- **Staff** (Settings → Staff, owner only): add more riders/owners, switch a login between Owner and Rider, reset passwords, block a login.
- Permissions are checked on the server: a rider can't open bills, dashboard, settings, staff or edit customers, and can only enter **today's** deliveries and cash.

## How it works
- **19L bottle only.** One price in Settings (and an optional special rate per customer).
- **Customer payment plan:** Daily / Weekly / Monthly payer, chosen when adding a customer.
  - Daily payer: cash box is pre-filled with today's amount.
  - Weekly / Monthly: the route shows **Collect payment** when there's a balance and no payment in the last 7 / 30 days.
- **Route:** area tabs + **All areas**, and a **search box** (name or house), so riders don't scroll.
- **Deliver:** set bottles, enter cash received (quick buttons: this delivery / full balance), see the balance after, then tap **Deliver & WhatsApp**. The delivery and the cash are saved, and WhatsApp opens with: date, bottles, cash received and remaining balance.
- **Balance** is shown on every route card and customer page, for both owner and rider.
- **Who did what:** every delivery and payment records the login. Dashboard → **Today by staff** shows homes, bottles and **cash to hand over** per rider; riders see their own totals in **My day**.
- Monthly bills (PDF, JazzCash logo), backups & restore to a previous day, PokitBio footer: same as the Pak Pure Pani app.

## Deploy (Render + Neon, about 15 min)
1. **Neon:** new project (Singapore), choose "connection string only", **Connect**, set pooling **OFF**, copy, and remove `&channel_binding=require`.
2. **GitHub:** new private repo; upload the *contents* of this folder.
3. **Render:** New → Blueprint → the repo. Fill `DATABASE_URL`, `SUPERADMIN_PASSWORD`, `OWNER_PASSWORD`, `RIDER_PASSWORD`.
4. Logs should show `Database ready`, then `Created superadmin login: pokitbio`, `Created admin login: owner` and `Created rider login: rider`.
5. Log in as **owner**: Settings → set the **19L bottle price** (starts at Rs 100) and JazzCash number, then add customers.

## Local run
```bash
npm install
cp .env.example .env   # fill DATABASE_URL etc.
npm run build && npm start
```
