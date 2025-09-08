import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Pico's weekplanner (pico-s-weekplanner)
const firebaseConfig = {
  apiKey: "AIzaSyCy0AhU6gIDYdsnoiBsmm5Bepo5Zp7G_U0",
  authDomain: "pico-s-weekplanner.firebaseapp.com",
  projectId: "pico-s-weekplanner",
  storageBucket: "pico-s-weekplanner.appspot.com",
  messagingSenderId: "369462198511",
  appId: "1:369462198511:web:de7bb02af1a18311ca9b1a",
};

const app = initializeApp(firebaseConfig);

// Nieuwe cache-API (vervangt enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);

// Zorg dat we (anoniem) ingelogd zijn; val terug op local-only als het niet lukt
let _authReadyPromise;
export function ensureAuth() {
  if (_authReadyPromise) return _authReadyPromise;
  _authReadyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      if (u) return resolve(u);
      try {
        const res = await signInAnonymously(auth);
        resolve(res.user);
      } catch (err) {
        console.warn("Anon sign-in failed; running local-only.", err);
        resolve(null);
      }
    });
  });
  return _authReadyPromise;
}
