/* AUNSA Firebase settings.
   Fill these in once during setup (see SETUP.md). Until apiKey is filled in,
   the site runs in DEMO MODE: the exec dashboard works in your browser only
   and nothing is saved online. */
window.AUNSA_FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",

  /* The club's own Google account (e.g. aunsa.club@gmail.com).
     It always has full control, so it's the emergency key if a president
     leaves without handing over. Must match OWNER_EMAIL in firestore.rules. */
  ownerEmail: "aunsa.akl@gmail.com"
};
