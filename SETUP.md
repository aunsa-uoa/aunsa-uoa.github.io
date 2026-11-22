# One-off setup: Google sign-in for the exec dashboard

Do this once, with the **club's own Google account**. It takes about 20 minutes.
Until it's done, the dashboard at `admin.html` runs in **demo mode**: you can try everything, but changes only stay in your own browser.

## 1. Create the club Google account

Create a new Gmail account for AUNSA (e.g. `aunsa.club@gmail.com`). This account:
- owns the Firebase project and always has full control of the site
- is the emergency key if a president leaves without handing over
- gets passed to each new president along with the other club logins

## 2. Create the Firebase project

1. Signed in as the club account, go to https://console.firebase.google.com and click **Create a project**.
2. Name it (e.g. `aunsa-website`). You can turn Google Analytics off.
3. Stay on the free **Spark** plan. No card is needed. If the site ever goes over the free limits, it pauses rather than charging you.

## 3. Turn on Google sign-in

1. Go to **Build → Authentication → Get started**.
2. Under **Sign-in method**, choose **Google**, switch it on, pick the club account as the support email, and save.

## 4. Create the database and add the security rules

1. Go to **Build → Firestore Database → Create database**.
2. Choose a location near Auckland (e.g. `australia-southeast1`, Sydney) and **production mode**.
3. Open the **Rules** tab.
4. Open `firestore.rules` from this repository. It already has the club account (`aunsa.akl@gmail.com`) as the owner. If the club account ever changes, update the email in this file and in `assets/js/firebase-config.js`.
5. Paste the whole file into the Rules tab, replacing what's there, and click **Publish**.

These rules are what really enforce exec permissions. They run on Google's servers.

## 5. Connect the website

1. Go to **Project settings** (the gear icon) **→ General → Your apps**, click the web icon `</>`, give it a nickname and register it. You don't need Firebase Hosting.
2. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `assets/js/firebase-config.js`.
3. Also set `ownerEmail` there to the club account's email.
4. Go to **Authentication → Settings → Authorized domains** and add your website's address, e.g. `aunsa-uoa.github.io` and any custom domain.

The `apiKey` isn't a secret. It's meant to be in the website. Your data is protected by the rules from step 4.

## 6. Publish and fill in the content

1. Upload the changed `firebase-config.js` to GitHub. The site updates in a minute or two.
2. Open `https://<your-site>/admin.html` and sign in with the **club account**.
3. On **Overview**, click **Import starter content**. This copies the sample events, team, guides and links into the database.
4. Go to **Exec access** and add the president's Google account, ticking **Make them a president**.
5. From then on, the president adds the rest of the exec and manages permissions.

## Free limits (Spark plan)

Firestore's free tier includes 1 GiB of storage, 50,000 reads a day and 20,000 writes a day. That's plenty for a club website: a home page visit uses roughly 10 to 15 reads. Photos are shrunk when uploaded and stored in the database, so you don't need the paid file storage.
