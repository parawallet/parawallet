import {remote} from "electron";
import { isProductionBuild } from "../runtime-args";

enum Level {"off", "error", "warn", "info", "debug"}
const loggingLevelStorageKey = "logging-level";

let globalLevel: Level;

class Loggers {
  private readonly map = new Map<string, Logger>();

  constructor() {
    globalLevel = Level[this.level as keyof typeof Level];
  }

  public getLogger(namespace: string) {
    let logger = this.map.get(namespace);
    if (!logger) {
      logger = new Logger(namespace);
      this.map.set(namespace, logger);
    }
    return logger;
  }

  public set level(level: string) {
    localStorage.setItem(loggingLevelStorageKey, level);
    globalLevel = Level[level as keyof typeof Level];
  }

  public get level(): string {
    const level = localStorage.getItem(loggingLevelStorageKey);
    return level || this.defaultLevel();
  }

  private defaultLevel(): string {
    const production = isProductionBuild(remote.process);
    return production ? Level[Level.error] : Level[Level.debug];
  }
}

export const loggers = new Loggers();

export class Logger {
  private readonly namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  public error(message: string, error?: any): void {
    if (globalLevel >= Level.error) {
      console.error(`ERROR - [${this.namespace}] - ${message}`, error);
    }
  }

  public warn(message: string): void {
    if (globalLevel >= Level.warn) {
      console.warn(`WARN - [${this.namespace}] - ${message}`);
    }
  }

  public info(message: string): void {
    if (globalLevel >= Level.info) {
      console.info(`INFO - [${this.namespace}] - ${message}`);
    }
  }

  public debug(message: string): void {
    if (globalLevel >= Level.debug) {
      console.debug(`DEBUG - [${this.namespace}] - ${message}`);
    }
  }

}
