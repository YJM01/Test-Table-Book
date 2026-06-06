# TableBook Deployment Guide

TableBook is a premium restaurant reservation system with two deployment tracks:
1. **Modern React Track** (Highly scalable, responsive React Single Page App, already compiling perfectly).
2. **Standard Static HTML Track** (Located in `/static-version/` containing standalone simple `index.html`, `admin.html`, `styles.css`, `app.js`, and `admin.js` files).

---

## 1. Google Sheets & Apps Script Setup (The Database & E-mail Router)

To enable real-time cloud data storage and automated Gmail notifications, set up your Google Sheet backend:

### Step 1: Prepare the Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a **blank spreadsheet**.
2. Rename the active tab in the lower left to exactly `Sheet1`.
3. In the very first row (Row 1), paste the following column headers exactly:
   ```txt
   ID | CustomerName | Email | Phone | ReservationDate | ReservationTime | Guests | SpecialRequest | Status | CreatedAt
   ```

### Step 2: Paste the Apps Script logic
1. Click **Extensions > Apps Script** in the top Google Sheet menu.
2. Clear any default template code present in the editor.
3. Open the file `google-apps-script.js` located in the root of this workspace. Copy the entire file contents and paste it into Google Sheets' `Code.gs` script editor.

### Step 3: Deploy the Web App API
1. In the top-right corner of the Apps Script dashboard, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set the following fields:
   * **Description**: `TableBook API Router`
   * **Execute as**: `Me (your-gmail-account@gmail.com)` (This allows Apps Script to dial out emails using your active Gmail mailbox).
   * **Who has access**: `Anyone` (Crucial: This lets the reservation form communicate with your spreadsheet securely without requiring customer Google logins).
4. Click **Deploy**.
5. Grant permissions: Click **Authorize access**, choose your Google email, expand "Advanced", click **Go to Code (unsafe)**, and agree to the permissions.
6. **Copy the provided Web App URL** from the output screen (it ends in `/exec`).

### Step 4: Link to your Dashboard
1. Open either the React app or static page admin configurations.
2. Paste your copied Google Web App URL into the **Google Apps Script Web App URL** input.
3. Save configurations! Your reservation form and admin console are now securely bound in real-time.

---

## 2. Cloudflare Pages Deployment (Hosting Your Static Site)

Deploy TableBook to Cloudflare Pages in less than 2 minutes:

### Step 1: Prepare the Files
Choose whether you want to deploy the static files or the React files:
* **Static Files (Recommended for simple hosting)**: Copy all contents of `/static-version/` (`index.html`, `admin.html`, `styles.css`, `app.js`, `admin.js`) into a dedicated directory.
* **React SPA**: Deploy the compiled React bundle from the `dist` directory after running `npm run build`.

### Step 2: Upload to Cloudflare Pages
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application > Pages > Upload assets**.
3. Create a unique project name (e.g., `tablebook-reservations`).
4. Drag and drop your folder of static files (`/static-version/`) or your compiled React folder (`dist`).
5. Click **Deploy site**.
6. Cloudflare will generate a secure, premium `https://<your-project>.pages.dev` URL!

### Step 3: Implement Cloudflare Access SSO Security
To fulfill the requirement **"Protect admin page using Cloudflare Access"**:
1. In your Cloudflare Dashboard, go to **Zero Trust** (or Access) in the sidebar.
2. Go to **Access > Applications** and click **Add an Application**.
3. Select **Self-Hosted**.
4. Set the Application Name: `TableBook Admin Console`.
5. Enter the protected URL domain: `your-project.pages.dev/admin.html` (for the static track) or set up matching conditional path protections.
6. Select **Policy**: Create a policy named `Authorized Managers`.
7. Under **Configure rules (Selector)**, choose **Emails**.
8. Paste your authorized administrative emails (e.g. `yunilajanu72@gmail.com` and `admin@tablebook.com`).
9. Click **Save**.
10. Uninvited visitors clicking on `admin.html` will be blocked at the edge and prompted for secure email PIN logins.

---

## 3. GitHub Repository Upload

To version control your project and sync with Cloudflare Pages continuous deployment:

### Step 1: Initialize Git
In your local command terminal inside the project root:
```bash
git init
git add .
git commit -m "feat: initial commit of TableBook Reservation System with React and Static profiles"
```

### Step 2: Sync with GitHub
1. Create a public or private repository named `tablebook-reservations` on [GitHub](https://github.com).
3. Connect your terminal and push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/tablebook-reservations.git
git branch -M main
git push -u origin main
```

### Step 3: Hook GitHub to Cloudflare Pages (Optional Continuous Deployment)
1. Go to **Workers & Pages > Pages** in Cloudflare.
2. Select **Connect to Git** instead of direct upload.
3. Link your GitHub account and choose the `tablebook-reservations` repository.
4. Set build settings:
   * For the **React Track**: Framework preset: `Vite`, Build command: `npm run build`, Output directory: `dist`.
   * For the **Static track**: Build command: (leave blank), Output directory: `static-version` (or your static folders root).
5. Click **Save and Deploy**. Cloudflare will now automatically rebuild and redeploy your app every single time you push a git commit!
