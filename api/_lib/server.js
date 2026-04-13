import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

function resolveServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZHhrcHlpcGZ4amZqbmR4b3N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUxOTg1MywiZXhwIjoyMDg2MDk1ODUzfQ.1D7wsd2QPOLaFeOS7bo_aPeHDJJB3P3TDF2LH4L3wc8"
  );
}

export function getSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  return createClient(supabaseUrl, resolveServiceRoleKey());
}

export function sendJson(res, status, body) {
  res.status(status).json(body);
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export async function getUserFromRequest(req) {
  const supabase = getSupabase();
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getAdminUser(req) {
  const supabase = getSupabase();
  const user = await getUserFromRequest(req);
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return user;
}

export async function ensureLessonAccess(userId, lessonId) {
  const supabase = getSupabase();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, video_url, title, course_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) return { allowed: false, reason: "Aula não encontrada" };

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", lesson.course_id)
    .maybeSingle();

  if (enrollmentError) throw enrollmentError;
  if (!enrollment) return { allowed: false, reason: "Sem acesso a este curso" };
  if (!lesson.video_url) return { allowed: false, reason: "Vídeo indisponível" };

  return { allowed: true, lesson };
}

function getDriveCredentials() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credentialsJson) {
    return JSON.parse(credentialsJson);
  }

  const keyFile =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ||
    path.join(rootDir, "lms-cursos-streaming-26f801dfa40b.json");

  if (!fs.existsSync(keyFile)) {
    throw new Error("Arquivo de credenciais do Google Drive não encontrado");
  }

  return JSON.parse(fs.readFileSync(keyFile, "utf8"));
}

export async function getDriveClient() {
  const credentials = getDriveCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  const authClient = await auth.getClient();
  return google.drive({ version: "v3", auth: authClient });
}

function getStreamSecret() {
  return (
    process.env.STREAM_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "learnhub-stream-secret"
  );
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function createStreamToken(payload) {
  const body = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 10,
  };
  const encoded = base64url(JSON.stringify(body));
  const signature = crypto.createHmac("sha256", getStreamSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyStreamToken(token) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) return null;

  const expected = crypto.createHmac("sha256", getStreamSecret()).update(encoded).digest("base64url");
  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
