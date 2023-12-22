import getConfig from "next/config";
import {
  ConfigEnum,
  DEV_CONFIG,
  STAGING_BONK_CONFIG,
  DEV_BONK_CONFIG,
  ParimutuelConfig,
  STAGING_CONFIG,
} from "@hxronetwork/parimutuelsdk";
import { clusterApiUrl } from "@solana/web3.js";
import { useSetting } from "@contexts/setting";

// eslint-disable-next-line
export const getWeb3Config = (selectedNetwork: string = "BONK"): ParimutuelConfig => {
  const {
    publicRuntimeConfig: { APP_ENV},
  } = getConfig();

  let c = DEV_BONK_CONFIG;
  if (selectedNetwork === "BONK"){
    if (APP_ENV === ConfigEnum.DEV) c = DEV_BONK_CONFIG;
    if (APP_ENV === ConfigEnum.STAGING) c = STAGING_BONK_CONFIG;
  }
  else
  {
    if (APP_ENV === ConfigEnum.DEV) c = DEV_CONFIG;
    if (APP_ENV === ConfigEnum.STAGING) c = STAGING_CONFIG;
    
  }

  return c as ParimutuelConfig;
};

export const getWeb3Url = () => {
  const {
    publicRuntimeConfig: { SOLANA_CLUSTER_URL },
  } = getConfig();

  if (SOLANA_CLUSTER_URL) return SOLANA_CLUSTER_URL

  return clusterApiUrl("devnet");
};
