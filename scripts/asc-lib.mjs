import { createSign } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const credDir = path.join(root, "credentials");
export const KEY_ID = "338NB7C99D";
export const ISSUER_ID = fs.readFileSync(path.join(credDir, "issuer.id"), "utf8").trim();
const P8 = fs.readFileSync(path.join(credDir, `AuthKey_${KEY_ID}.p8`), "utf8");

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function makeJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: ISSUER_ID,
      iat: now,
      exp: now + 20 * 60,
      aud: "appstoreconnect-v1",
    }),
  );
  const data = `${header}.${payload}`;
  const sign = createSign("SHA256");
  sign.update(data);
  sign.end();
  return `${data}.${b64url(sign.sign({ key: P8, dsaEncoding: "ieee-p1363" }))}`;
}

export async function asc(method, urlPath, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${makeJwt()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(`ASC ${res.status} ${method} ${urlPath}: ${text.slice(0, 800)}`);
    err.detail = json;
    throw err;
  }
  return json;
}

export function readAppId() {
  return fs.readFileSync(path.join(credDir, "ascAppId.txt"), "utf8").trim();
}
