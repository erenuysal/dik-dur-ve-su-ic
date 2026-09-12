/**
 * App Store Connect: bundle + app kaydı.
 *
 *   node scripts/asc-create-app.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { root, credDir, asc } from "./asc-lib.mjs";

const BUNDLE_ID = "com.seperra.dikdurvesuic";
const APP_NAME = "Dik dur ve su iç";
const SKU = "dik-dur-ve-su-ic";
void fileURLToPath;

function patchEas(ascAppId) {
  const easPath = path.join(root, "eas.json");
  const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
  eas.submit.production.ios.ascAppId = String(ascAppId);
  fs.writeFileSync(easPath, `${JSON.stringify(eas, null, 2)}\n`);
}

const apps = await asc("GET", `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`);
if (apps.data?.[0]) {
  const id = apps.data[0].id;
  fs.writeFileSync(path.join(credDir, "ascAppId.txt"), `${id}\n`);
  patchEas(id);
  console.log("Zaten var ascAppId=", id);
  process.exit(0);
}

const bundles = await asc(
  "GET",
  `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}`,
);
let bundleIdResourceId = bundles.data?.[0]?.id || null;
if (!bundleIdResourceId) {
  const createdBundle = await asc("POST", "/v1/bundleIds", {
    data: {
      type: "bundleIds",
      attributes: { identifier: BUNDLE_ID, name: "DikDurVeSuIc", platform: "IOS" },
    },
  });
  bundleIdResourceId = createdBundle.data.id;
  console.log("Bundle ID:", bundleIdResourceId);
}

const created = await asc("POST", "/v1/apps", {
  data: {
    type: "apps",
    attributes: {
      bundleId: BUNDLE_ID,
      name: APP_NAME,
      primaryLocale: "tr",
      sku: SKU,
    },
  },
});
const id = created.data.id;
fs.writeFileSync(path.join(credDir, "ascAppId.txt"), `${id}\n`);
patchEas(id);
console.log("ASC app oluşturuldu ascAppId=", id);
