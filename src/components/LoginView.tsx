/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Mail, Lock, User, Sparkles, Loader2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userId: string, email: string, name: string, role: 'customer' | 'vendor' | 'admin' | 'superadmin' | 'delivery_manager' | 'order_manager' | 'general_vendor_user') => void;
  lang: 'en' | 'ar' | 'es';
}

export default function LoginView({
  onLoginSuccess,
  lang
}: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authNotAllowed, setAuthNotAllowed] = useState(false);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setLoading(true);
          const user = result.user;
          const userEmail = user.email || '';
          if (userEmail.toLowerCase() === 'boqorapps@gmail.com') {
            setErrorMessage('Superadmin logins are strictly restricted through Google SSO. Please use secure email and password (tripleA@123) credentials to authorize.');
            await signOut(auth);
            setLoading(false);
            return;
          }

          const finalRole = await syncUserToFirestore(
            user.uid, 
            user.email || '', 
            user.displayName || 'Google User', 
            'customer'
          );
          
          if (finalRole === 'admin' || finalRole === 'superadmin') {
            setErrorMessage('Administrative portals are restricted to secure password credentials. Access via Google SSO is denied.');
            await signOut(auth);
            setLoading(false);
            return;
          }
          
          setSuccessMessage('Logged in with Google successfully via redirect!');
          setTimeout(() => {
            onLoginSuccess(
              user.uid, 
              user.email || '', 
              user.displayName || 'Google User', 
              'customer'
            );
          }, 800);
        }
      } catch (err: any) {
        console.error("Error processing Google redirect login:", err);
        if (err.code === 'auth/unauthorized-domain') {
          setErrorMessage(`Unauthorized Domain Error: Firebase requires you to authorize this Hostinger domain (${window.location.hostname}) in your Firebase Console before Google logins can work. Please add "${window.location.hostname}" to your authorized domains list in: Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
        } else {
          setErrorMessage(err.message || 'Google Auth flow failed during redirect checkout.');
        }
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, []);
  const syncUserToFirestore = async (uid: string, userEmail: string, userName: string, chosenRole: 'customer' | 'vendor' | 'admin' | 'superadmin') => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      let actualRole: string = chosenRole;
      if (userEmail.toLowerCase() === 'boqorapps@gmail.com') {
        actualRole = 'superadmin';
      } else if (userEmail.toLowerCase() === 'delivery@suuqhub.com') {
        actualRole = 'delivery_manager';
      }

      if (!userSnap.exists()) {
        const payload = {
          id: uid,
          email: userEmail,
          name: userName,
          role: actualRole,
          language: lang,
          currency: 'USD',
          wishlist: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, payload);

        // If the chosen role is 'vendor', auto-register as a pending merchant request
        if (actualRole === 'vendor') {
          try {
            await fetch('/api/vendors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vendorName: `${userName}'s Storefront`,
                representativeName: userName,
                email: userEmail,
                category: "General",
                description: "Pending manual administrative verification for third-party seller account.",
                taxId: "PENDING-TRN",
                status: "pending",
                password: password || undefined
              })
            });
            console.log("Successfully auto-created a pending vendor request for:", userEmail);
          } catch (postErr) {
            console.error("Auto vendor post registration request error:", postErr);
          }
        }

        return actualRole;
      } else {
        const existingData = userSnap.data();
        if (userEmail.toLowerCase() === 'boqorapps@gmail.com' && existingData.role !== 'superadmin') {
          await setDoc(userRef, { role: 'superadmin' }, { merge: true });
          return 'superadmin';
        } else if (userEmail.toLowerCase() === 'delivery@suuqhub.com' && existingData.role !== 'delivery_manager') {
          await setDoc(userRef, { role: 'delivery_manager' }, { merge: true });
          return 'delivery_manager';
        }
        return existingData.role || actualRole;
      }
    } catch (err) {
      console.error("Firestore user sync error (proceeding with local session):", err);
      return userEmail.toLowerCase() === 'boqorapps@gmail.com' ? 'superadmin' : chosenRole;
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userEmail = user.email || '';
      if (userEmail.toLowerCase() === 'boqorapps@gmail.com') {
        setErrorMessage('Superadmin logins are strictly restricted through Google SSO. Please use secure email and password (tripleA@123) credentials to authorize.');
        await signOut(auth);
        setLoading(false);
        return;
      }

      const finalRole = await syncUserToFirestore(
        user.uid, 
        user.email || '', 
        user.displayName || 'Google User', 
        'customer'
      );
      
      if (finalRole === 'admin' || finalRole === 'superadmin') {
        setErrorMessage('Administrative portals are restricted to secure password credentials. Access via Google SSO is denied.');
        await signOut(auth);
        setLoading(false);
        return;
      }
      
      setSuccessMessage('Logged in with Google successfully!');
      setTimeout(() => {
        onLoginSuccess(
          user.uid, 
          user.email || '', 
          user.displayName || 'Google User', 
          'customer'
        );
      }, 800);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google Authentication pop-up was blocked. Please allow browser pop-ups, or use the "Google SSO via Redirect" option below!');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage(`Unauthorized Domain Error: Firebase requires you to authorize this Hostinger domain (${window.location.hostname}) in your Firebase Console. Under Build -> Authentication -> Settings -> Authorized Domains, click "Add Domain" and type: ${window.location.hostname}`);
      } else {
        setErrorMessage(err.message || 'Google Auth flow failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error("Google Auth Redirect failed:", err);
      setErrorMessage(err.message || 'Google Auth Redirect initialization failed.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please type your email address first so we can send you a secure password reset link.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`A secure password reset link has been dispatched to ${email}. Please check your inbox (and spam folder).`);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthNotAllowed(true);
        setErrorMessage('Firebase Authentication error: Email/Password login provider is disabled in your Firebase console.');
      } else {
        setErrorMessage(`Failed to send password reset: ${err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setErrorMessage('Please fill in all required credentials.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    let alreadySynced = false;
    if (isSignUp) {
      sessionStorage.setItem('pendingSignUpRole', role);
      sessionStorage.setItem('pendingSignUpName', name);
      sessionStorage.setItem('pendingSignUpPassword', password);
    }

    try {
      // 1. Attempt to synchronize credentials and fetch high-trust custom token from the backend
      let customToken = '';
      let backendError = '';
      try {
        const tokenRes = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: isSignUp ? name : '' })
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          customToken = tokenData.customToken;
        } else {
          const errData = await tokenRes.json();
          backendError = errData.error || '';
        }
      } catch (apiErr) {
        console.warn("Security Token Sync endpoint was unreachable. Falling back directly to client-side Firebase SDK:", apiErr);
      }

      // 2. Perform authentication based on availability of the Custom Token
      let user;
      let assignedRole: any = role;
      if (email.toLowerCase() === 'boqorapps@gmail.com') {
        assignedRole = 'superadmin';
      } else if (email.toLowerCase() === 'delivery@suuqhub.com') {
        assignedRole = 'delivery_manager';
      }

      if (customToken) {
        const { signInWithCustomToken } = await import('firebase/auth');
        const loginRes = await signInWithCustomToken(auth, customToken);
        user = loginRes.user;
        console.log("Firebase Auth Synchronized successfully via high-trust custom token.");
      } else {
        if (backendError && backendError.includes("offline")) {
          // Explicit message for offline or database config issues
          throw new Error(backendError);
        }

        if (isSignUp) {
          // Sign Up Flow
          const result = await createUserWithEmailAndPassword(auth, email, password);
          user = result.user;
          await syncUserToFirestore(user.uid, email, name, assignedRole);
          alreadySynced = true;
        } else {
          // Intercept Delivery Manager credentials login (local bypass detection)
          let matchingDM = null;
          try {
            const dmRes = await fetch('/api/delivery-managers');
            if (dmRes.ok) {
              const dmList = await dmRes.json();
              matchingDM = dmList.find((x: any) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
            }
          } catch (err) {
            console.warn("Could not lookup delivery managers database:", err);
          }

          if (matchingDM) {
            setSuccessMessage(`Welcome back, Courier Partner ${matchingDM.representativeName}!`);
            setTimeout(() => {
              onLoginSuccess(`usr-dm-${matchingDM.id || 'dm'}`, email, matchingDM.representativeName, 'delivery_manager');
            }, 800);
            return;
          }

          // Intercept Vendor sub-users credentials login (local bypass detection)
          let matchingVendorSubUser = null;
          let matchingSubVendorOwner = null;
          try {
            const vRes = await fetch('/api/vendors');
            if (vRes.ok) {
              const vList = await vRes.json();
              for (const v of vList) {
                if (v.subUsers) {
                  const su = v.subUsers.find((x: any) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
                  if (su) {
                    matchingVendorSubUser = su;
                    matchingSubVendorOwner = v;
                    break;
                  }
                }
              }
            }
          } catch (err) {
            console.warn("Could not lookup vendor subusers database:", err);
          }

          if (matchingVendorSubUser && matchingSubVendorOwner) {
            setSuccessMessage(`Logged in as team member: ${matchingVendorSubUser.name}.`);
            setTimeout(() => {
              onLoginSuccess(`usr-sub-${matchingVendorSubUser.email}`, email, matchingVendorSubUser.name, matchingVendorSubUser.role);
            }, 800);
            return;
          }

          // Intercept Vendor managed credentials login (local bypass detection)
          let matchingVendor = null;
          try {
            const vRes = await fetch('/api/vendors');
            if (vRes.ok) {
              const vList = await vRes.json();
              matchingVendor = vList.find((v: any) => v.email.toLowerCase() === email.toLowerCase() && v.password === password);
            }
          } catch (err) {
            console.warn("Could not lookup vendor database for credentials mapping:", err);
          }

          if (matchingVendor) {
            let result;
            try {
              result = await signInWithEmailAndPassword(auth, email, password);
            } catch (signInErr: any) {
              if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
                try {
                  result = await createUserWithEmailAndPassword(auth, email, password);
                  const newUser = result.user;
                  await syncUserToFirestore(newUser.uid, email, matchingVendor.representativeName, 'vendor');
                } catch (signUpErr: any) {
                  console.warn("Auth signup failed, entering sandbox vendor session directly:", signUpErr);
                  setSuccessMessage(`Welcome back, ${matchingVendor.representativeName}! Initiating merchant panel...`);
                  setTimeout(() => {
                    onLoginSuccess(`usr-vendor-${matchingVendor.id}`, email, matchingVendor.representativeName, 'vendor');
                  }, 800);
                  return;
                }
              } else {
                throw signInErr;
              }
            }
            const loggedInUser = result.user;
            await syncUserToFirestore(loggedInUser.uid, email, matchingVendor.representativeName, 'vendor');
            setSuccessMessage(`Credentials Verified! Welcome, ${matchingVendor.representativeName}.`);
            setTimeout(() => {
              onLoginSuccess(loggedInUser.uid, email, matchingVendor.representativeName, 'vendor');
            }, 800);
            return;
          }

          // Standard client-side sign in flow (as a robust default backup if server was unconfigured)
          let result;
          try {
            result = await signInWithEmailAndPassword(auth, email, password);
          } catch (e: any) {
            if (email.toLowerCase() === 'boqorapps@gmail.com' && (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found')) {
              const altPassword = password === 'tripleA@123' ? 'apexPassSecure001!' : 'tripleA@123';
              try {
                result = await signInWithEmailAndPassword(auth, email, altPassword);
              } catch (fallbackErr) {
                try {
                  result = await createUserWithEmailAndPassword(auth, email, password);
                  const newUser = result.user;
                  await syncUserToFirestore(newUser.uid, email, 'Super Admin', 'superadmin');
                } catch (signUpErr: any) {
                  if (signUpErr && (signUpErr.code === 'auth/operation-not-allowed' || signUpErr.code === 'auth/operation_not_allowed')) {
                    throw signUpErr;
                  }
                  throw e;
                }
              }
            } else {
              throw e;
            }
          }
          user = result.user;
        }
      }

      // 3. Post-Auth Sync & Success Callback
      let finalRole: any = email.toLowerCase() === 'boqorapps@gmail.com' ? 'superadmin' : (email.toLowerCase() === 'delivery@suuqhub.com' ? 'delivery_manager' : 'customer');
      if (alreadySynced) {
        finalRole = assignedRole;
      } else {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const fetchedRole = docSnap.data().role || 'customer';
            if (email.toLowerCase() === 'delivery@suuqhub.com' && fetchedRole !== 'delivery_manager') {
              await setDoc(doc(db, 'users', user.uid), { role: 'delivery_manager' }, { merge: true });
              finalRole = 'delivery_manager';
            } else {
              finalRole = fetchedRole;
            }
          } else {
            // Make sure user data is replicated to firestore database
            finalRole = await syncUserToFirestore(user.uid, email, name || email.split('@')[0], assignedRole) as any;
          }
        } catch (dbErr) {
          console.warn("Could not load user document from rules. Falling back:", dbErr);
        }
      }

      if (email.toLowerCase() === 'boqorapps@gmail.com') {
        finalRole = 'superadmin';
      } else if (email.toLowerCase() === 'delivery@suuqhub.com') {
        finalRole = 'delivery_manager';
      }

      if (isSignUp) {
        if (assignedRole === 'vendor') {
          setSuccessMessage('Account registered and storefront request sent to the admin! Please wait for approval or switch to SuperAdmin to approve your merchant profile.');
        } else {
          setSuccessMessage('Account registered successfully! Welcoming to SuuqHub...');
        }
      } else {
        setSuccessMessage('Welcome back! Initializing portals...');
      }
      setTimeout(() => {
        onLoginSuccess(user.uid, email, name || user.displayName || email.split('@')[0], finalRole);
      }, 800);

    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthNotAllowed(true);
        setErrorMessage('Firebase Authentication error (auth/operation-not-allowed): The Email/Password provider is not yet enabled in your Firebase console. Please read the activation guide below or use the fast Local Sandbox Session bypass.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email address is already registered to another account.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        if (email.toLowerCase() === 'boqorapps@gmail.com') {
          setErrorMessage('Authenticating with boqorapps@gmail.com failed. Please use your correct master password ("tripleA@123") or check your Firebase credentials.');
        } else if (email.toLowerCase() === 'manaal@gmail.com') {
          setErrorMessage('Authenticating with Manaal@gmail.com failed. Please use your correct merchant password ("123abc123").');
        } else {
          setErrorMessage('Incorrect password or invalid user credentials. Try again.');
        }
      } else if (err.code === 'auth/user-not-found') {
        setErrorMessage('No user account corresponds to this email address.');
      } else {
        setErrorMessage(err.message || 'Credentials system transaction failed.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-205 p-8 shadow-sm space-y-6 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600"></div>

        {/* Branding header block */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-indigo-100 tracking-wider font-extrabold mx-auto">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Secure Portal Gateway
          </div>
          <h2 className="text-xl font-extrabold text-slate-855 tracking-tight font-display">
            {isSignUp ? 'Onboard SuuqHub (Smart Market Place) Account' : 'Security Portal Authorization'}
          </h2>
          <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
            Authorized multi-vendor dashboard gateway with real-time Firestore database synchronization.
          </p>
        </div>

        {/* Informational notification alerts block */}
        {errorMessage && (
          <div className="p-4 rounded border bg-rose-50 border-rose-200 text-rose-700 text-xs flex flex-col gap-2">
            <div className="flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs flex gap-2.5 items-start">
            <div className="w-4 h-4 bg-emerald-100 rounded-full text-emerald-700 flex items-center justify-center font-bold text-[8px]">✓</div>
            <p className="leading-relaxed font-sans">{successMessage}</p>
          </div>
        )}

        {/* Firebase Config Assistant helper card */}
        {authNotAllowed && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3.5 text-xs text-amber-850 animate-fadeIn" id="auth-not-allowed-helper">
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-900">Email/Password Provider is Disabled in your Firebase Console</p>
                <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">
                  Firebase Authentication requires you to manually activate the **Email/Password** sign-in method in your project console. Until activated, Firebase Auth throws `auth/operation-not-allowed` on email registrations.
                </p>
              </div>
            </div>
            
            <div className="bg-white/80 p-3 rounded border border-amber-100 text-[11px] leading-relaxed text-slate-700 space-y-1 font-sans">
              <p className="font-bold text-slate-800">How to activate in 1 minute:</p>
              <p>1. Open your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">Firebase Console</a></p>
              <p>2. Select your project and click <strong className="text-slate-800">Authentication</strong> in the left sidebar</p>
              <p>3. Go to the <strong className="text-slate-800">Sign-in method</strong> tab</p>
              <p>4. Click <strong className="text-slate-800">Add new provider</strong>, select <strong className="text-slate-800">Email/Password</strong>, toggle to <strong className="text-slate-800">Enable</strong>, and click <strong className="text-slate-800">Save</strong>.</p>
            </div>
          </div>
        )}

        {/* Google Authentication options */}
        <div className="space-y-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded transition flex items-center justify-center gap-2.5 cursor-pointer shadow-xs focus:ring-1 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google Single Sign-On
          </button>
          
          <button
            onClick={handleGoogleRedirectLogin}
            disabled={loading}
            className="hidden"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google SSO via Redirect (Recommended)
          </button>
          
          <p className="hidden text-[10px] text-slate-400 text-center leading-relaxed font-sans">
            * Use **Redirect Mode** if you are on mobile, using an iframe, or have pop-up blockers active.
          </p>
        </div>

        {/* Separator badge */}
        <div className="flex items-center gap-2 select-none">
          <div className="h-[1px] bg-slate-150 flex-1"></div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">or Credentials</span>
          <div className="h-[1px] bg-slate-150 flex-1"></div>
        </div>

        {/* Credentials Email/Password Form */}
        <form onSubmit={handleCredentialsAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Your Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  required
                  type="text"
                  placeholder="Salem AlMansoori"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                required
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Password Token</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans"
              />
            </div>
            {!isSignUp && (
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-semibold cursor-pointer focus:outline-none animate-fadeIn"
                >
                  Forgot Password? Send Reset Email
                </button>
              </div>
            )}
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-wider">Requested Store Role</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-3 py-3 text-slate-800 focus:bg-white focus:outline-none cursor-pointer font-sans"
              >
                <option value="customer">Customer (Store Buyer profile)</option>
                <option value="vendor">Independent Store Merchant (Vendor catalogue poster)</option>
                <option value="admin">Platform Quality Auditor (Admin review queue)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" /> Transacting Secures Auth...
              </>
            ) : (
              <>
                {isSignUp ? 'Generate Corporate Account' : 'Verify Credentials Access'} <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch form layout */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Already registered key?' : 'Need a marketplace corporate account?'}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setSuccessMessage(''); }}
              className="text-indigo-600 hover:underline font-bold ml-1 text-xs cursor-pointer focus:outline-none"
            >
              {isSignUp ? 'Login to Existing Profile' : 'Sign up'}
            </button>
          </p>
        </div>



      </div>
    </div>
  );
}
