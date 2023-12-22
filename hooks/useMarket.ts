import { useMemo } from "react";
import {
  isParimutuelAccount,
  MarketPairEnum,
  ParimutuelAccount,
  ParimutuelMarket,
  ParimutuelPosition,
  ParimutuelWeb3
} from "@hxronetwork/parimutuelsdk";

import { useParimutuel } from "@contexts/parimutuel";
import { getMarketByPubkey, getMarketPairByPubkey } from "@utils/utils";
import { useSetting } from "@contexts/setting";

export type MarketBoardItem = {
  key: { parimutuelPubkey: string; marketPubkey: string };
  market: {
    marketPair: string;
    duration: number;
  };
  time: { startTime: number; endTime: number };
  pool: { poolSize: number; long: number; short: number };
  position: { long: number; short: number };
  locked: { price: number };
  settled: { price: number };
  payout: {
    longPool: number;
    shortPool: number;
    longPosition: number;
    shortPosition: number;
    lockedPrice: number;
    settledPrice: number;
    parimutuelPubkey: string;
    marketPubkey: string;
    isExpired: boolean;
  };
};

export const parseMarket = (
  parimutuelAccount: ParimutuelAccount,
  markets: ParimutuelMarket[],
  positions: ParimutuelPosition[],
  usdDecimal: number,
  decimalPLaces: number,
  contractSize: number,
  web3?: ParimutuelWeb3,
): MarketBoardItem => {
  const { parimutuel } = parimutuelAccount.info;
  const market = getMarketByPubkey(parimutuel.marketKey, markets);
  const foundPosition = positions.find(
    (position) => position.info.parimutuelPubkey.toBase58() === parimutuelAccount.pubkey.toBase58(),
  );

  const { timeWindowStart, activeLongPositions, activeShortPositions, strike, index, expired } =
    parimutuel;

  const duration = market?.info.market.duration.toNumber() ?? 0;
  const longPosition = foundPosition?.info.position?.longPosition.toNumber() ?? 0;
  const shortPosition = foundPosition?.info.position?.shortPosition.toNumber() ?? 0;

  const decimalDivider = 10 ** decimalPLaces / contractSize;

  return {
    key: {
      parimutuelPubkey: parimutuelAccount.pubkey.toBase58(),
      marketPubkey: parimutuel.marketKey,
    },
    market: {
      marketPair: getMarketPairByPubkey(parimutuel.marketKey, web3),
      duration,
    },
    time: {
      startTime: timeWindowStart.toNumber(),
      endTime: timeWindowStart.toNumber() + duration * 1000,
    },
    pool: {
      poolSize: (activeLongPositions.toNumber() + activeShortPositions.toNumber()) / decimalDivider,
      long: activeLongPositions.toNumber() / decimalDivider,
      short: activeShortPositions.toNumber() / decimalDivider,
    },
    position: {
      long: longPosition / decimalDivider,
      short: shortPosition / decimalDivider,
    },
    locked: {
      price: strike.toNumber() / 10 ** usdDecimal,
    },
    settled: {
      price: index.toNumber() / 10 ** usdDecimal,
    },
    payout: {
      longPosition: longPosition / decimalDivider,
      shortPosition: shortPosition / decimalDivider,
      longPool: activeLongPositions.toNumber() / decimalDivider,
      shortPool: activeShortPositions.toNumber() / decimalDivider,
      lockedPrice: strike.toNumber() / 10 ** usdDecimal,
      settledPrice: index.toNumber() / 10 ** usdDecimal,
      parimutuelPubkey: parimutuelAccount.pubkey.toBase58(),
      marketPubkey: parimutuel.marketKey,
      isExpired: !!expired,
    },
  };
};

export const useMarket = () => {
  const { positions, markets, parimutuels, web3 } = useParimutuel();
  const { decimalPlaces, selectedMarketKey, selectedMarketPair } = useSetting();

  const contractSize = useMemo(() => markets[0]?.info.market.contractSize.toNumber(), [markets]);

  const usdDecimal = useMemo(() => {
    return 8;
  }, []);

  const settledParimutuels = useMemo(
    () =>
      parimutuels
        .filter((account) => isParimutuelAccount(account.account))
        .filter((account) => {
          const { parimutuel } = account.info;
          const market = getMarketByPubkey(parimutuel.marketKey, markets);
          const duration = market?.info.market.duration.toNumber() ?? 0;
          return new Date().getTime() > parimutuel.timeWindowStart.toNumber() + duration * 1000;
        })
        .map((account) => {
          const data = parseMarket(
            account,
            markets,
            positions,
            usdDecimal,
            decimalPlaces,
            contractSize,
            web3
          );
          return data;
        })
        .sort((a, b) => a.time.startTime - b.time.startTime),
    [parimutuels, markets, positions, usdDecimal, decimalPlaces, contractSize],
  );

  const lastParimutuel = useMemo(
    () =>
      parimutuels
        .filter((account) => isParimutuelAccount(account.account))
        .filter((account) => {
          const { parimutuel } = account.info;
          const market = getMarketByPubkey(parimutuel.marketKey, markets);
          const duration = market?.info.market.duration.toNumber() ?? 0;
          const currentTime = new Date().getTime();
          return (
            currentTime > parimutuel.timeWindowStart.toNumber() + duration * 1000 &&
            parimutuel.timeWindowStart.toNumber() > currentTime - duration * 2000
          );
        })
        .map((account) => {
          const data = parseMarket(
            account,
            markets,
            positions,
            usdDecimal,
            decimalPlaces,
            contractSize,
            web3
          );
          return data;
        })
        .sort((a, b) => a.time.startTime - b.time.startTime),
    [parimutuels, markets, positions, usdDecimal, decimalPlaces, contractSize],
  );

  const nextFiveUpcomingParimuels = useMemo(
    () =>
      parimutuels
        .filter((account) => isParimutuelAccount(account.account))
        .filter((account) => {
          const { parimutuel } = account.info;
          const market = getMarketByPubkey(parimutuel.marketKey, markets);
          const duration = market?.info.market.duration.toNumber() ?? 0;
          const currentTime = new Date().getTime();
          return (
            parimutuel.marketKey == selectedMarketKey &&
            duration == 60 &&
            currentTime < parimutuel.timeWindowStart.toNumber() &&
            currentTime + duration * 1000 > parimutuel.timeWindowStart.toNumber()
          );
        })
        .map((account) => {
          const data = parseMarket(
            account,
            markets,
            positions,
            usdDecimal,
            decimalPlaces,
            contractSize,
            web3
          );
          return data;
        }),
    [parimutuels, markets, positions, usdDecimal, decimalPlaces, contractSize],
  );

  const liveParimutuels = useMemo(
    () =>
      parimutuels
        .filter((account) => isParimutuelAccount(account.account))
        .filter((account) => {
          const { parimutuel } = account.info;
          const market = getMarketByPubkey(parimutuel.marketKey, markets);
          const duration = market?.info.market.duration.toNumber() ?? 0;
          const currentTime = new Date().getTime();
          return (
            parimutuel.marketKey == selectedMarketKey &&
            duration == 60 &&
            currentTime > parimutuel.timeWindowStart.toNumber() &&
            currentTime < parimutuel.timeWindowStart.toNumber() + duration * 1000
          );
        })
        .map((account) => {
          const data = parseMarket(
            account,
            markets,
            positions,
            usdDecimal,
            decimalPlaces,
            contractSize,
            web3
          );
          return data;
        })
        .sort((a, b) => a.time.startTime - b.time.startTime),
    [parimutuels, markets, positions, usdDecimal, decimalPlaces, contractSize],
  );

  return {
    settledParimutuels,
    liveParimutuels,
    nextFiveUpcomingParimuels,
    lastParimutuel,
  };
};
