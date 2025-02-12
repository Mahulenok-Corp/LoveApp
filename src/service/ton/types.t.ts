
export type CHAIN = "-239" | "-3"

export type AuthToken = {
    address: string;
    network: CHAIN;
  };
  
  export type PayloadToken = {
    payload: string;
  };


  
export interface TonProof {
    address: string;
    network: CHAIN;
    public_key: string;
    proof: {
        payload: string;
        timestamp: number;
        domain: {
            value: string;
            lengthBytes: number;
        };
        signature: string;
        state_init: string;
    };
  }