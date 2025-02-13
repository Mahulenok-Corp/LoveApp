import WebSocket from "ws";
import { logger } from "../../shared/logger/logger.js";
import { AvailableHandlers } from "../../shared/addresses.js";
import { getEventFromTx } from "../common/getEventFromTx.js";

interface JsonRpcRequest {
  id: number;
  jsonrpc: string;
  method: string;
  params: any[];
}
interface JsonRpcResponse {
  jsonrpc: string;
  method: string;
  params: {
    account_id: string;
    lt: number;
    tx_hash: string;
  };
}

export async function startWebSocket(accountHex: string, task: AvailableHandlers) {
  try {
    const tonapiWs = "wss://tonapi.io/v2/websocket";

    const request: JsonRpcRequest = {
      id: 1,
      jsonrpc: "2.0",
      method: "subscribe_account",
      params: [accountHex],
    };

    let ws = new WebSocket(tonapiWs);

    ws.on("open", function open() {
      logger.info(`Try to connect to Websocket: ${tonapiWs}`);
      ws.send(JSON.stringify(request));
      logger.info("Connected to Tonview websocket");
    });

    ws.on("message", async function incoming(data: Buffer) {
      const messageString = data.toString(); // Convert Buffer to string
      const messageObject: JsonRpcResponse = JSON.parse(messageString); // Parse the JSON message
      if (messageObject.method === "subscribe_account") return;
      logger.info(`WS received ${messageObject.params.tx_hash}`);
      getEventFromTx(accountHex, messageObject.params.tx_hash);
    });

    ws.on("error", function error(error) {
      logger.error(`WebSocket error: ${error}`);
    });

    ws.on("close", function close() {
      logger.warn("Connection closed");
      ws = null;
      setTimeout(() => startWebSocket(accountHex, task), 100);
    });
  } catch (error) {
    logger.error(error);
  }
}
