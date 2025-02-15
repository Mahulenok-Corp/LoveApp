import {Address, TonClient4} from "@ton/ton";
import {Buffer} from "buffer";
import {CHAIN} from "./types.t.js"

export class TonApiService {

  public static create(client: TonClient4 | CHAIN): TonApiService {
    if (client === "-239") {
      client = new TonClient4({
        endpoint: 'https://mainnet-v4.tonhubapi.com'
      });
    }
    if (client === "-3") {
      client = new TonClient4({
        endpoint: 'https://testnet-v4.tonhubapi.com'
      });
    }
    return new TonApiService(client);
  }

  private readonly client: TonClient4;

  private constructor(client: TonClient4) {
    this.client = client;
  }

  /**
   * Get wallet public key by address.
   */
  public async getWalletPublicKey(address: string): Promise<Buffer> {
    const masterAt = await this.client.getLastBlock();
    const result = await this.client.runMethod(
      masterAt.last.seqno, Address.parse(address), 'get_public_key', []);
    return Buffer.from(result.reader.readBigNumber().toString(16).padStart(64, '0'), 'hex');
  }

  /**
   * Get account info by address.
   */
  public async getAccountInfo(address: string): Promise<ReturnType<TonClient4['getAccount']>> {
    const masterAt = await this.client.getLastBlock();
    return await this.client.getAccount(masterAt.last.seqno, Address.parse(address));
  }

}
