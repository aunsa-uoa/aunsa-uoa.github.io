/* AUNSA Firebase settings.
   Fill these in once during setup (see SETUP.md). Until apiKey is filled in,
   the site runs in DEMO MODE: the exec dashboard works in your browser only
   and nothing is saved online. */
window.AUNSA_FIREBASE = {
  apiKey: "AIzaSyDHX7ykB2RxfGLUkM4oojlSGLqEEW2Bmn4",
  authDomain: "aunsa-website.firebaseapp.com",
  projectId: "aunsa-website",
  appId: "1:169940614870:web:aa54d648425eb00688d377",

  /* The club's own Google account.
     It always has full control, so it's the emergency key if a president
     leaves without handing over. Must match ownerEmail() in firestore.rules. */
  ownerEmail: "aunsa.akl@gmail.com"
};
