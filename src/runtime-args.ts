import * as path from "path";

function readArg(process: NodeJS.Process, argName: string) {
  console.log(`ARGS: ${process.argv}, READ: ${argName}`);
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
  } else {
    console.log(`Selected DEFAULT profile`);
  }
}

export function isProductionBuild(process: NodeJS.Process) {
  const prod = readArg(process, prodFlag);
  if (prod) {
    console.log(`Running PRODUCTION BUILD!`);
    return true;
  }

  console.log(`Running DEVELOPMENT BUILD!`);
  return false;
}
