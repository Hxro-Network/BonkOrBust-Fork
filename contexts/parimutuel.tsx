import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useInterval } from "react-use";
import {
  decodeAccount,
  getMarketPubkeys,
  ParimutuelAccount,
  ParimutuelMarket,
  ParimutuelNetwork,
  ParimutuelPosition,
  ParimutuelTraderFeePayerAccount,
  ParimutuelWeb3,
  STAGING_BONK_CONFIG
} from "@hxronetwork/parimutuelsdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import _isEmpty from "lodash/isEmpty";

import { useSetting } from "./setting";
import getConfig from "next/config";
import { getWeb3Config } from "@constants/config";

export interface ParimutuelContextProps {
  traderFeePayerAccount?: ParimutuelTraderFeePayerAccount;
  network?: ParimutuelNetwork;
  markets: ParimutuelMarket[];
  parimutuels: ParimutuelAccount[];
  positions: ParimutuelPosition[];
  getPositions: () => void;
  getFeeAccounts: () => void;
  protocolFeeAmount: number;
  settlementFeeAmount: number;
  settled: string[];
  setSettled: (values: string[]) => void;
  web3?: ParimutuelWeb3;
  setWeb3: (web3SDK: ParimutuelWeb3) => void;
}

const defaultContext: ParimutuelContextProps = {
  traderFeePayerAccount: undefined,
  network: undefined,
  markets: [],
  parimutuels: [],
  positions: [],
  getPositions: () => null,
  getFeeAccounts: () => null,
  protocolFeeAmount: 0,
  settlementFeeAmount: 0,
  settled: [],
  setSettled: () => null,
  web3: undefined,
  setWeb3: () => null,
};

const ParimutuelContext = React.createContext<ParimutuelContextProps>({ ...defaultContext });

export const ParimutuelProvider: React.FC = ({ children }) => {
  const { selectedMarketPair, selectedNetwork } = useSetting();
  const { connection } = useConnection();
  const config = getWeb3Config(selectedNetwork);
  const [web3, setWeb3] = useState<ParimutuelWeb3>(
    useMemo(() => new ParimutuelWeb3(config, connection), [connection, config]),
  );
  const wallet = useWallet();
  const { publicKey: walletPubkey } = wallet;

  const [traderFeePayerAccount, setTraderFeePayerAccount] = useState<
    ParimutuelTraderFeePayerAccount | undefined
  >(undefined);
  const [parimutuels, setParimutuels] = useState<ParimutuelAccount[]>([]);
  const [network, setNetwork] = useState<ParimutuelNetwork | undefined>(undefined);
  const [markets, setMarkets] = useState<ParimutuelMarket[]>([]);
  const [positions, setPositions] = useState<ParimutuelPosition[]>([]);
  const [protocolFeeAmount, setProtocolFeeAmount] = useState<number>(
    defaultContext.protocolFeeAmount,
  );
  const [settlementFeeAmount, setSettlementFeeAmount] = useState<number>(
    defaultContext.settlementFeeAmount,
  );
  const [settled, setSettled] = useState<string[]>(defaultContext.settled);

  const fetchPositions = useCallback(async () => {
    if (!web3 || !walletPubkey || _isEmpty(markets)) return;
    const positions = await web3.getUserPositions(walletPubkey, markets);
    setPositions(positions);
  }, [markets, walletPubkey, web3]);

  const fetchParimutuels = useCallback(async () => {
    const current_config = getWeb3Config(selectedNetwork);
    const marketPubkeys = getMarketPubkeys(current_config, selectedMarketPair);
    const parimutuels = await web3.getParimutuels(marketPubkeys, 5);
    if (parimutuels.length > 0) setParimutuels(parimutuels);
  }, [selectedMarketPair, web3, config]);

  const fetchFees = useCallback(async () => {
    if (!web3 || !network || !markets || !markets.length) return;
    const market = markets[0];
    const {
      network: { protocolFeeAmount, settlementFeeAmount },
    } = await web3.getFees(
      new PublicKey(network.info.network.authority),
      new PublicKey(market.info.market.authority),
    );

    setProtocolFeeAmount(protocolFeeAmount);
    setSettlementFeeAmount(settlementFeeAmount);
  }, [markets, network, web3]);

  const fetchFeeAccounts = useCallback(async () => {
    if (!web3 || !network || !wallet?.publicKey) return;

    const feePayerAccount = await web3.getTraderFeePayerAccount(wallet?.publicKey, network.pubkey);
    setTraderFeePayerAccount(feePayerAccount);
  }, [network, wallet.publicKey, web3]);

  useInterval(() => {
    fetchParimutuels();
    fetchFees();
    fetchPositions();
  }, 1000 * 3);

  useEffect(() => {
    if (!web3 || !network || !wallet?.publicKey) return;
    let subscriptionId: number;

    const fetchFeeAccounts = async () => {
      if (!network || !wallet?.publicKey) return;

      const feePayerAccount = await web3.getTraderFeePayerAccount(
        wallet?.publicKey,
        network.pubkey,
      );
      setTraderFeePayerAccount(feePayerAccount);

      if (web3.connection) {
        subscriptionId = web3.connection.onAccountChange(feePayerAccount.pubkey, (account) => {
          setTraderFeePayerAccount((prev) => {
            if (prev) {
              return {
                ...prev,
                account,
                info: {
                  tokenAccount: {
                    ...prev.info.tokenAccount,
                    account,
                    info: decodeAccount(account.data),
                  },
                },
              };
            }
            return prev;
          });
        });
      }
    };

    fetchFeeAccounts();

    return () => {
      web3.connection?.removeAccountChangeListener(subscriptionId).catch(() => {
        // eslint-disable-next-line
        console.warn(
          `Unsuccessfully attempted to remove listener for subscription id ${subscriptionId}`,
        );
      });
    };
  }, [network, wallet, web3]);

  useEffect(() => {
    fetchPositions();
    fetchFeeAccounts();
  }, [fetchPositions, fetchFeeAccounts]);

  useEffect(() => {
    fetchParimutuels();
  }, [selectedNetwork, selectedMarketPair]); 

  useEffect(() => {
    if (!web3) return;
    Promise.all([web3.getNetwork(), web3.getMarkets(selectedMarketPair)]).then(
      ([network, markets]) => {
        setNetwork(network);
        setMarkets(markets);
      },
    );
  }, [web3, walletPubkey, selectedMarketPair]);

  const setSettledParimutuels = (values: string[]) => {
    setSettled(values);
  };

  const setWeb3SDK = (value: ParimutuelWeb3) => {
    setWeb3(value)
  };

  return (
    <ParimutuelContext.Provider
      value={{
        traderFeePayerAccount,
        network,
        markets,
        parimutuels,
        positions,
        getPositions: fetchPositions,
        getFeeAccounts: fetchFeeAccounts,
        protocolFeeAmount,
        settlementFeeAmount,
        settled,
        setSettled: setSettledParimutuels,
        web3,
        setWeb3: setWeb3SDK,
      }}
    >
      {children}
    </ParimutuelContext.Provider>
  );
};

export const useParimutuel = () => {
  const context = useContext(ParimutuelContext);
  if (context === undefined) {
    throw new Error("useParimutuel must be used within a ParimutuelProvider");
  }
  return context;
};
