import type { coreMessages } from "./core-messages.ts";

/** New translations must provide every English key, including tool-specific controls. */
export type LocaleMessages = { [Key in keyof typeof coreMessages.en]: string };
