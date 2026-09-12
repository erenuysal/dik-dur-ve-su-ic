/**
 * Mevcut iOS Distribution sertifikasıyla App Store profili.
 *
 *   node scripts/asc-ios-profile.mjs
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { credDir, root, asc } from "./asc-lib.mjs";

const BUNDLE_ID = "com.seperra.dikdurvesuic";
const chefDir = path.join(root, "..", "ChefDeCuisine", "credentials");

const certs = await asc(
  "GET",
  "/v1/certificates?filter[certificateType]=IOS_DISTRIBUTION&limit=10",
);
const cert = certs.data?.[0];
if (!cert) throw new Error("IOS_DISTRIBUTION sertifikası yok");
console.log("cert", cert.id, cert.attributes?.name, cert.attributes?.displayName);

const bundles = await asc(
  "GET",
  `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}`,
);
const bundle = bundles.data?.[0];
if (!bundle) throw new Error("bundle yok");

try {
  await asc("POST", "/v1/bundleIdCapabilities", {
    data: {
      type: "bundleIdCapabilities",
      attributes: { capabilityType: "PUSH_NOTIFICATIONS" },
      relationships: { bundleId: { data: { type: "bundleIds", id: bundle.id } } },
    },
  });
  console.log("PUSH_NOTIFICATIONS eklendi");
} catch (e) {
  console.log("capability:", e.message.slice(0, 180));
}

const profile = await asc("POST", "/v1/profiles", {
  data: {
    type: "profiles",
    attributes: {
      name: `DikDurVeSuIc AppStore`,
      profileType: "IOS_APP_STORE",
    },
    relationships: {
      bundleId: { data: { type: "bundleIds", id: bundle.id } },
      certificates: { data: [{ type: "certificates", id: cert.id }] },
    },
  },
});
const profilePath = path.join(credDir, "ios-dist.mobileprovision");
fs.writeFileSync(profilePath, Buffer.from(profile.data.attributes.profileContent, "base64"));
console.log("profile", profile.data.id);

const chefP12 = path.join(chefDir, "ios-dist.p12");
const chefPass = fs.readFileSync(path.join(chefDir, "p12-pass.txt"), "utf8").trim();
fs.copyFileSync(chefP12, path.join(credDir, "ios-dist.p12"));
fs.writeFileSync(path.join(credDir, "ios-dist-password.txt"), chefPass);

const creds = {
  ios: {
    provisioningProfilePath: "credentials/ios-dist.mobileprovision",
    distributionCertificate: {
      path: "credentials/ios-dist.p12",
      password: chefPass,
    },
  },
};
fs.writeFileSync(path.join(root, "credentials.json"), `${JSON.stringify(creds, null, 2)}\n`);

try {
  execSync(
    `security cms -D -i "${profilePath}" | plutil -extract Entitlements xml1 -o - -`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch {
  /* ignore */
}
console.log("credentials.json hazır");
