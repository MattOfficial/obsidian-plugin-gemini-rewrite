import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
if (!targetVersion) {
  console.error("Please specify a target version!");
  process.exit(1);
}

// read minAppVersion from manifest.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
// update version in manifest.json
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update version in package.json
const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));
packageJSON.version = targetVersion;
writeFileSync("package.json", JSON.stringify(packageJSON, null, "\t"));

// update version in versions.json
let versions = {};
try {
  versions = JSON.parse(readFileSync("versions.json", "utf8"));
} catch (e) {
  console.info("versions.json not found, creating a new one");
}
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
