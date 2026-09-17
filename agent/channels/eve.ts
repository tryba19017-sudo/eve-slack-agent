import { none, localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

const publicChat = process.env.EVE_PUBLIC_CHAT === "1";

export default eveChannel({
  auth: publicChat
    ? [localDev(), none()]
    : [vercelOidc(), localDev()],
});
