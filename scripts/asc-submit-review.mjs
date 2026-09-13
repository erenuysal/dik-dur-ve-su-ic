/**
 * App Review gönderimi.
 *
 *   node scripts/asc-submit-review.mjs --submit
 */
import { asc, readAppId } from "./asc-lib.mjs";

const APP_ID = readAppId();
const doSubmit = process.argv.includes("--submit");

const versions = await asc(
  "GET",
  `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10`,
);
const version = (versions.data || []).find((v) =>
  ["PREPARE_FOR_SUBMISSION", "READY_FOR_REVIEW", "REJECTED", "DEVELOPER_REJECTED"].includes(
    v.attributes.appStoreState || v.attributes.appVersionState,
  ),
);
if (!version) {
  console.error("Gönderilecek sürüm yok");
  process.exit(1);
}
const buildId = version.relationships?.build?.data?.id;
console.log(
  `Sürüm: ${version.attributes.versionString} — ${version.attributes.appStoreState || version.attributes.appVersionState}`,
  "build",
  buildId || "(yok)",
);
if (!buildId) {
  console.error("Sürüme build bağlı değil");
  process.exit(1);
}

const subs = await asc(
  "GET",
  `/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&limit=20`,
);
let submission = (subs.data || []).find((s) =>
  ["READY_FOR_REVIEW", "UNRESOLVED_ISSUES", "COMPLETING"].includes(s.attributes.state),
);

if (!doSubmit) {
  console.log(submission ? `Açık: ${submission.attributes.state} ${submission.id}` : "Açık submission yok");
  process.exit(0);
}

if (!submission) {
  const created = await asc("POST", "/v1/reviewSubmissions", {
    data: {
      type: "reviewSubmissions",
      attributes: { platform: "IOS" },
      relationships: { app: { data: { type: "apps", id: APP_ID } } },
    },
  });
  submission = created.data;
  console.log("submission", submission.id);
}

const items = await asc(
  "GET",
  `/v1/reviewSubmissions/${submission.id}/items?include=appStoreVersion&limit=20`,
).catch(() => ({ data: [] }));
const hasVersion = (items.data || []).some(
  (i) => i.relationships?.appStoreVersion?.data?.id === version.id,
);
if (!hasVersion && submission.attributes.state !== "UNRESOLVED_ISSUES") {
  await asc("POST", "/v1/reviewSubmissionItems", {
    data: {
      type: "reviewSubmissionItems",
      relationships: {
        reviewSubmission: { data: { type: "reviewSubmissions", id: submission.id } },
        appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
      },
    },
  });
}

const done = await asc("PATCH", `/v1/reviewSubmissions/${submission.id}`, {
  data: {
    type: "reviewSubmissions",
    id: submission.id,
    attributes: { submitted: true },
  },
});
console.log("durum", done.data.attributes.state, submission.id);
