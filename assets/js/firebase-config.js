/* AUNSA Firebase settings (see SETUP.md).
   These aren't secret: they're meant to be in the website. The data is
   protected by the security rules in firestore.rules. */
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
