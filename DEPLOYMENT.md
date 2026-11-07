# 🌐 24/7 Cloud Deployment Guide for Kairos Lite WhatsApp Bot

## ❓ Why the Bot Stops Working When Your Computer is Off

Currently, the bot is running **locally on your computer** (`localhost:5000`) and using a local tunnel (such as ngrok or cloudflared).

When your computer is turned off, put to sleep, or disconnected from Wi-Fi:
1. The **Node.js process terminates**.
2. The **local tunnel disconnects**.
3. Meta WhatsApp Cloud API tries to send customer messages to your webhook, but your computer cannot receive them.

---

## 🚀 The Permanent Fix: Host on a 24/7 Cloud Server (Free)

By deploying your bot to a cloud platform like **Render**, **Railway**, or **Koyeb**:
* The bot runs **24 hours a day, 7 days a week, 365 days a year**.
* It continues working smoothly even when your laptop/desktop is completely powered off.
* You get a permanent, official HTTPS webhook URL (no more renewing ngrok URLs).

---

## 📌 Option 1: Deploy on Render (Recommended & Free)

### Step 1: Push your code to GitHub
Open your terminal in `c:\Users\SABARI SJ\Desktop\whatsapp-Kairos\whatsapp-new` and run:

```bash
git init
git add .
git commit -m "feat: 24/7 whatsapp bot cloud backend"
git branch -M main
```
Create a new private or public repository on [GitHub](https://github.com/new) named `kairos-whatsapp-bot`, then link and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/kairos-whatsapp-bot.git
git push -u origin main
```

---

### Step 2: Create a Web Service on Render
1. Go to [Render.com](https://render.com) and sign up / log in with GitHub.
2. In the Render Dashboard, click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `kairos-whatsapp-bot` repository.
4. Fill in the service settings:
   * **Name**: `kairos-whatsapp-bot`
   * **Region**: Singapore or Frankfurt (closest to your audience)
   * **Branch**: `main`
   * **Root Directory**: Leave blank (or `./`)
   * **Runtime**: `Node`
   * **Build Command**: `npm install --prefix backend`
   * **Start Command**: `node backend/server.js`
   * **Instance Type**: **Free**

---

### Step 3: Add Environment Variables
Under the **Environment Variables** section on Render, add the exact keys and values from your `backend/.env` file:

| Key | Value | Description |
|---|---|---|
| `PORT` | `10000` | Port automatically assigned by Render |
| `NODE_ENV` | `production` | Production environment |
| `WHATSAPP_ACCESS_TOKEN` | *(Your Permanent Meta System User Token)* | Token from Meta Business Manager |
| `WHATSAPP_PHONE_NUMBER_ID` | `1393037967216637` | Your Phone Number ID |
| `WHATSAPP_WABA_ID` | `1125512693348242` | Your WhatsApp Business Account ID |
| `WHATSAPP_PHONE_NUMBER` | `+919629531891` | Your WhatsApp Number |
| `GRAPH_API_VERSION` | `v26.0` | Meta Graph API Version |
| `WHATSAPP_VERIFY_TOKEN` | `sproutks_webhook_verify_token_2026` | Verification token configured in Meta |

Click **Create Web Service**. Render will build and deploy the bot in 1–2 minutes!

---

### Step 4: Update the Webhook in Meta Developers Portal
Once deployed, Render gives you a live permanent URL, for example:
`https://kairos-whatsapp-bot.onrender.com`

1. Open [Meta Developers Portal](https://developers.facebook.com/apps/).
2. Select your WhatsApp App.
3. In the left sidebar, navigate to **WhatsApp** > **Configuration**.
4. In the **Webhook** section, click **Edit**:
   * **Callback URL**: `https://kairos-whatsapp-bot.onrender.com/webhook`
   * **Verify Token**: `sproutks_webhook_verify_token_2026`
5. Click **Verify and Save**.
6. Ensure the **messages** webhook field is subscribed (toggle ON).

---

### Step 5: Keep It Awake 24/7 (Prevent Free Tier Sleep)
Render's free tier spins down after 15 minutes of inactivity. To ensure instant replies 24/7:
1. Create a free account at [UptimeRobot.com](https://uptimerobot.com) or [Cron-job.org](https://cron-job.org).
2. Add a new HTTP monitor pointing to your root health check URL:
   `https://kairos-whatsapp-bot.onrender.com/`
3. Set the monitoring interval to **every 5 or 10 minutes**.
4. This keeps the server constantly warm and responsive 24/7 with zero cold starts!

---

## 📌 Option 2: Deploy on Railway (Alternative)
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Under **Variables**, add all values from your `backend/.env`.
4. Under **Settings** > **Networking**, click **Generate Domain**.
5. Copy your new domain (e.g. `https://kairos-bot-production.up.railway.app/webhook`) and update it in Meta Developers.

---

## ✅ Result
Once deployed to cloud hosting:
* 🔋 Your laptop or desktop can be shut down, disconnected, or completely powered off.
* 🤖 Your WhatsApp chatbot will continue replying instantly and flawlessly 24 hours a day, 7 days a week!
