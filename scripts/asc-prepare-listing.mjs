/**
 * Listing, yaş, kategori, 6.7" ekran görüntüleri.
 *
 *   node scripts/asc-prepare-listing.mjs
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { root, readAppId, asc } from "./asc-lib.mjs";

const APP_ID = readAppId();
const PRIVACY = "https://erenuysal.github.io/dik-dur-ve-su-ic/gizlilik.html";
const DESCRIPTION = `Dik dur ve su iç, gün içinde omuzlarını ve suyu unutmaman için nazik hatırlatmalar gönderir.

Seçtiğin aralıkla (30 dakika–3 saat) bildirim gelir. Uygulama yalnızca sabah 11:00 ile akşam 21:00 arasında çalışır.

Bir bildirimi görüp onaylamazsan yenisi gelmez; bildirim durur. 3 saat tıklamazsan tek bir nazik tekrar gider.

Hesap yok. Sunucuya veri gitmez. Hatırlatmalar cihazında yerelde planlanır.

Bu bir tıbbi cihaz veya tedavi uygulaması değildir; yalnızca hatırlatır.`;

async function uploadScreenshot(setId, filePath) {
  const data = fs.readFileSync(filePath);
  const reserved = await asc("POST", "/v1/appScreenshots", {
    data: {
      type: "appScreenshots",
      attributes: {
        fileName: path.basename(filePath),
        fileSize: data.length,
      },
      relationships: {
        appScreenshotSet: { data: { type: "appScreenshotSets", id: setId } },
      },
    },
  });
  const shotId = reserved.data.id;
  const ops = reserved.data.attributes.uploadOperations || [];
  for (const op of ops) {
    const chunk = data.subarray(op.offset, op.offset + op.length);
    const headers = {};
    for (const h of op.requestHeaders || []) {
      headers[h.name] = h.value;
    }
    const put = await fetch(op.url, { method: op.method || "PUT", headers, body: chunk });
    if (!put.ok) {
      throw new Error(`Upload ${put.status} ${filePath}`);
    }
  }
  await asc("PATCH", `/v1/appScreenshots/${shotId}`, {
    data: {
      type: "appScreenshots",
      id: shotId,
      attributes: {
        uploaded: true,
        sourceFileChecksum: createHash("md5").update(data).digest("hex"),
      },
    },
  });
  console.log("screenshot", path.basename(filePath));
}

const infos = await asc("GET", `/v1/apps/${APP_ID}/appInfos?include=appInfoLocalizations,primaryCategory`);
const info = infos.data?.[0];
if (!info) throw new Error("appInfo yok");

const locs = (infos.included || []).filter((x) => x.type === "appInfoLocalizations");
const trInfo = locs.find((x) => x.attributes.locale?.startsWith("tr")) || locs[0];
if (trInfo) {
  await asc("PATCH", `/v1/appInfoLocalizations/${trInfo.id}`, {
    data: {
      type: "appInfoLocalizations",
      id: trInfo.id,
      attributes: {
        name: "Dik dur ve su iç",
        subtitle: "Duruş ve su hatırlatması",
        privacyPolicyUrl: PRIVACY,
      },
    },
  });
  console.log("appInfoLocalization güncellendi");
}

const categories = await asc("GET", "/v1/appCategories?filter[platforms]=IOS&limit=50");
const health = (categories.data || []).find((c) =>
  /HEALTH_AND_FITNESS|HEALTH/i.test(`${c.id} ${c.attributes?.platforms || ""}`),
);
const healthId =
  (categories.data || []).find((c) => c.id === "HEALTH_AND_FITNESS")?.id || health?.id;
if (healthId) {
  await asc("PATCH", `/v1/appInfos/${info.id}`, {
    data: {
      type: "appInfos",
      id: info.id,
      relationships: {
        primaryCategory: { data: { type: "appCategories", id: healthId } },
      },
    },
  }).catch((e) => console.warn("kategori:", e.message));
}

let versions = await asc(
  "GET",
  `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10`,
);
let version = (versions.data || []).find((v) =>
  ["PREPARE_FOR_SUBMISSION", "REJECTED", "DEVELOPER_REJECTED", "METADATA_REJECTED"].includes(
    v.attributes.appStoreState || v.attributes.appVersionState,
  ),
);
if (!version) {
  const created = await asc("POST", "/v1/appStoreVersions", {
    data: {
      type: "appStoreVersions",
      attributes: {
        platform: "IOS",
        versionString: "1.0.0",
        copyright: "2026 Seperra Software",
      },
      relationships: { app: { data: { type: "apps", id: APP_ID } } },
    },
  });
  version = created.data;
  console.log("sürüm oluşturuldu", version.id);
}

const vLocs = await asc("GET", `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
let vLoc = (vLocs.data || []).find((x) => x.attributes.locale?.startsWith("tr")) || vLocs.data?.[0];
if (!vLoc) {
  const createdLoc = await asc("POST", "/v1/appStoreVersionLocalizations", {
    data: {
      type: "appStoreVersionLocalizations",
      attributes: {
        locale: "tr",
        description: DESCRIPTION,
        keywords: "su,dik dur,duruş,hatırlatma,su iç,mola",
        marketingUrl: "https://seperrasoftware.com/",
        supportUrl: "https://seperrasoftware.com/iletisim",
      },
      relationships: {
        appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
      },
    },
  });
  vLoc = createdLoc.data;
} else {
  await asc("PATCH", `/v1/appStoreVersionLocalizations/${vLoc.id}`, {
    data: {
      type: "appStoreVersionLocalizations",
      id: vLoc.id,
      attributes: {
        description: DESCRIPTION,
        keywords: "su,dik dur,duruş,hatırlatma,su iç,mola",
        marketingUrl: "https://seperrasoftware.com/",
        supportUrl: "https://seperrasoftware.com/iletisim",
      },
    },
  });
}
console.log("listing metni tamam");

const ratingRel = await asc("GET", `/v1/appStoreVersions/${version.id}/ageRatingDeclaration`);
if (ratingRel.data?.id) {
  await asc("PATCH", `/v1/ageRatingDeclarations/${ratingRel.data.id}`, {
    data: {
      type: "ageRatingDeclarations",
      id: ratingRel.data.id,
      attributes: {
        alcoholTobaccoOrDrugUseOrReferences: "NONE",
        contests: "NONE",
        gamblingSimulated: "NONE",
        medicalOrTreatmentInformation: "NONE",
        profanityOrCrudeHumor: "NONE",
        sexualContentGraphicAndNudity: "NONE",
        sexualContentOrNudity: "NONE",
        horrorOrFearThemes: "NONE",
        matureOrSuggestiveThemes: "NONE",
        violenceCartoonOrFantasy: "NONE",
        violenceRealistic: "NONE",
        violenceRealisticProlongedGraphicOrSadistic: "NONE",
        gambling: false,
        unrestrictedWebAccess: false,
        kidsAgeBand: null,
      },
    },
  }).catch((e) => console.warn("yaş:", e.message));
}

const review = await asc("GET", `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`).catch(
  () => ({ data: null }),
);
const reviewAttrs = {
  contactFirstName: "Eren",
  contactLastName: "Uysal",
  contactEmail: "seperra@hotmail.com",
  contactPhone: "+905533821355",
  demoAccountRequired: false,
  notes:
    "Hesap yok. Uygulamayı açın, hatırlatmaları açın, aralık seçin. İsteğe bağlı: 5 saniye sonra dene. Bildirimde İçtim veya Dik durdum ile onaylanır. Tıbbi iddia yok; yalnızca hatırlatma.",
};
if (review.data?.id) {
  await asc("PATCH", `/v1/appStoreReviewDetails/${review.data.id}`, {
    data: { type: "appStoreReviewDetails", id: review.data.id, attributes: reviewAttrs },
  });
} else {
  await asc("POST", "/v1/appStoreReviewDetails", {
    data: {
      type: "appStoreReviewDetails",
      attributes: reviewAttrs,
      relationships: {
        appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
      },
    },
  });
}
console.log("review notes tamam");

const sets = await asc(
  "GET",
  `/v1/appStoreVersionLocalizations/${vLoc.id}/appScreenshotSets?filter[screenshotDisplayType]=APP_IPHONE_67`,
);
let setId = sets.data?.[0]?.id;
if (!setId) {
  const createdSet = await asc("POST", "/v1/appScreenshotSets", {
    data: {
      type: "appScreenshotSets",
      attributes: { screenshotDisplayType: "APP_IPHONE_67" },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: "appStoreVersionLocalizations", id: vLoc.id },
        },
      },
    },
  });
  setId = createdSet.data.id;
}

const existingShots = await asc("GET", `/v1/appScreenshotSets/${setId}/appScreenshots`);
for (const shot of existingShots.data || []) {
  await asc("DELETE", `/v1/appScreenshots/${shot.id}`).catch(() => {});
}

const shotDir = path.join(root, "store", "screenshots");
for (const name of [
  "iphone-67-1-aralik.png",
  "iphone-67-2-onay.png",
  "iphone-67-3-bildirim.png",
]) {
  await uploadScreenshot(setId, path.join(shotDir, name));
}

console.log("listing hazır", { app: APP_ID, version: version.id });
