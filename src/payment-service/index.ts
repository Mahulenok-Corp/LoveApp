import { AvailableAddresses } from "../shared/addresses.js";
import { startBackrunner } from "./workers/backrunner.js";
import { startWebSocket } from "./workers/ws.js";

export async function startPaymentService() {
  startBackrunner(AvailableAddresses.payment, "payment");
  startWebSocket(AvailableAddresses.payment, "payment");
}
