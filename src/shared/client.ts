import { Api, HttpClient } from "tonapi-sdk-js";
import { config } from "./config.js";

const httpClient = new HttpClient({
  baseUrl: "https://tonapi.io/",
  baseApiParams: {
    headers: {
      Authorization: `Bearer AG2S7LKLF3UP22IAAAAI7UO6PF25CHXJUPVIQKFCO66BBDZJOIG3MSQI4ZXZTJAFVWM3TRI`,
      "Content-type": "application/json",
    },
  },
});

export const client = new Api(httpClient);
