import * as path from "path";

function readArg(process: NodeJS.Process, argName: string) {
  return process.argv.find((arg) => arg.startsWith(argName));
}

const profileFlag = "--profile=";
const prodFlag = "--prod";

export function setProfile(process: NodeJS.Process, app: Electron.App) {
  const profileArg = readArg(process, profileFlag);
  if (profileArg) {
    const profile = profileArg.replace(profileFlag, "");
    console.log(`Selected profile: ${profile}`);
    const defaultPath = app.getPath("userData");
    const profilePath = path.join(defaultPath, `Profile-${profile}`);
    console.log(`Using profile path: ${profilePath}`);
    app.setPath("userData", profilePath);
  }
}

export function isProductionBuild(process: NodeJS.Process) {
  const prod = readArg(process, prodFlag);
  if (prod) {
    return true;
  }
  return false;
}
