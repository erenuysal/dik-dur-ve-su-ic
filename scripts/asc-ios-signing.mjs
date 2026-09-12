/**
 * Yeni iOS App Store dağıtım sertifikası + profil (CSR bizde).
 *
 *   node scripts/asc-ios-signing.mjs
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { credDir, asc } from "./asc-lib.mjs";

const BUNDLE_ID = "com.seperra.dikdurvesuic";
const keyPath = path.join(credDir, "ios-dist.key");
const csrPath = path.join(credDir, "ios-dist.csr");
const cerPath = path.join(credDir, "ios-dist.cer");
const p12Path = path.join(credDir, "ios-dist.p12");
const profilePath = path.join(credDir, "ios-dist.mobileprovision");
const passPath = path.join(credDir, "ios-dist-password.txt");

if (!fs.existsSync(keyPath)) {
  execSync(
    `openssl req -nodes -newkey rsa:2048 -keyout "${keyPath}" -out "${csrPath}" -subj "/CN=DikDurVeSuIc/O=Seperra Software/C=TR"`,
    { stdio: "inherit" },
  );
}

const bundles = await asc(
  "GET",
  `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}`,
);
const bundleResource = bundles.data?.[0];
if (!bundleResource) throw new Error("Bundle ID ASC'de yok");

const csr = fs.readFileSync(csrPath, "utf8");
const cert = await asc("POST", "/v1/certificates", {
  data: {
    type: "certificates",
    attributes: {
      certificateType: "IOS_DISTRIBUTION",
      csrContent: csr,
    },
  },
});
const certId = cert.data.id;
const cerB64 = cert.data.attributes.certificateContent;
fs.writeFileSync(cerPath, Buffer.from(cerB64, "base64"));
console.log("certificate", certId);

const password = `Dd${Date.now().toString(36)}`;
fs.writeFileSync(passPath, password);
execSync(
  `openssl pkcs12 -export -inkey "${keyPath}" -in "${cerPath}" -out "${p12Path}" -passout pass:${password} -legacy || openssl pkcs12 -export -inkey "${keyPath}" -in "${cerPath}" -out "${p12Path}" -passout pass:${password}`,
  { stdio: "inherit" },
);

const profile = await asc("POST", "/v1/profiles", {
  data: {
    type: "profiles",
    attributes: {
      name: `DikDurVeSuIc App Store ${Date.now()}`,
      profileType: "IOS_APP_STORE",
    },
    relationships: {
      bundleId: { data: { type: "bundleIds", id: bundleResource.id } },
      certificates: { data: [{ type: "certificates", id: certId }] },
    },
  },
});
fs.writeFileSync(profilePath, Buffer.from(profile.data.attributes.profileContent, "base64"));
console.log("profile", profile.data.id);

const creds = {
  ios: {
    provisioningProfilePath: "credentials/ios-dist.mobileprovision",
    distributionCertificate: {
      path: "credentials/ios-dist.p12",
      password,
    },
  },
};
fs.writeFileSync(path.join(path.dirname(credDir), "credentials.json"), `${JSON.stringify(creds, null, 2)}\n`);
console.log("credentials.json yazıldı");
