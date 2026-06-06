import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageFile = resolve(root, "ios/App/CapApp-SPM/Package.swift");
const windowsPath = String.raw`..\..\..\node_modules\@capacitor\local-notifications`;
const macPath = "../../../node_modules/@capacitor/local-notifications";

const contents = readFileSync(packageFile, "utf8");
writeFileSync(packageFile, contents.replace(windowsPath, macPath));
