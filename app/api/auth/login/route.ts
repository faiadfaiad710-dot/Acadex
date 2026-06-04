import { NextRequest } from "next/server";
import { credentialToEmail } from "@/lib/auth/phone";
import { establishSessionFromIdToken } from "@/lib/auth/login";

function authErrorMessage(code?: string) {
  switch (code) {
    case "EMAIL_NOT_FOUND":
    case "INVALID_LOGIN_CREDENTIALS":
    case "INVALID_PASSWORD":
      return "Roll number or password is incorrect.";
    case "USER_DISABLED":
      return "This account is disabled.";
    case "MISSING_PASSWORD":
      return "Enter your password.";
    default:
      return "Login failed. Please try again.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { loginId, password } = (await req.json()) as {
      loginId?: string;
      password?: string;
    };

    const email = credentialToEmail(String(loginId || ""));
    if (!email || !password) {
      return Response.json({ error: "Enter roll number and password." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Firebase API key is missing." }, { status: 500 });
    }

    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    const authData = await authRes.json().catch(() => null);
    if (!authRes.ok) {
      const code = authData?.error?.message;
      return Response.json({ error: authErrorMessage(code) }, { status: 401 });
    }

    const profile = await establishSessionFromIdToken(authData.idToken);

    return Response.json({
      ok: true,
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
      localId: authData.localId,
      profile
    });
  } catch (error) {
    console.error("Login API failed", error);
    return Response.json(
      {
        error:
          error instanceof Error && error.message.includes("fetch")
            ? "Login network failed. Check internet connection and Firebase settings."
            : "Login failed. Please try again."
      },
      { status: 500 }
    );
  }
}
