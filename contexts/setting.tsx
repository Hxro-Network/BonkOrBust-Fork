import React, { useContext, useState } from "react";
import getConfig from "next/config";
import {
  ConfigEnum,
  MarketPairEnum,
  MIN_1,
  MIN_5,
  ParimutuelWeb3,
  PositionSideEnum,
  STAGING_BONK_CONFIG,
} from "@hxronetwork/parimutuelsdk";

import { PositionSummaryOptionEnum } from "@utils/utils";

// const [network, setNetwork] = useState<string>("BONK");

const {
  publicRuntimeConfig: { APP_ENV },
} = getConfig();

type SettingContextProps = {
  selectedMarketPair: MarketPairEnum;
  setSelectedMarketPair: (pair: MarketPairEnum) => void;
  selectedDurations: number[];
  setSelectedDurations: (duration: number) => void;
  selectedParimutuel: string;
  setSelectedParimutuel: (parimutuel: string) => void;
  positionSide: PositionSideEnum;
  setPositionSide: (direction: PositionSideEnum) => void;
  positionSummaryOption: PositionSummaryOptionEnum;
  setPositionSummaryOption: (option: PositionSummaryOptionEnum) => void;
  setDecimalPlaces: (decimalPlaces: number) => void;
  decimalPlaces: number;
  setSelectedMarketKey: (marketKey: string) => void;
  selectedMarketKey: string;
  livePrice: number;
  setLivePrice: (livePrice: number) => void;
  selectedNetwork: string;
  setSelectedNetwork: (networks: string) => void;

};

const defaultContext: SettingContextProps = {
  selectedMarketPair: MarketPairEnum.SOLUSD,
  selectedDurations: [MIN_1],
  selectedParimutuel: "",
  positionSide: PositionSideEnum.LONG,
  positionSummaryOption: PositionSummaryOptionEnum.ALL,
  decimalPlaces: 5,
  selectedMarketKey: "",
  livePrice: 0,
  selectedNetwork: "BONK",
  setSelectedMarketPair: () => null,
  setSelectedDurations: () => null,
  setSelectedParimutuel: () => null,
  setPositionSide: () => null,
  setPositionSummaryOption: () => null,
  setDecimalPlaces: () => null,
  setSelectedMarketKey: () => null,
  setLivePrice: () => null,
  setSelectedNetwork: () => null,
};

export const SettingContext = React.createContext<SettingContextProps>(defaultContext);

export const SettingProvider: React.FC = ({ children }) => {
  const [selectedMarketPair, setSelectedMarketPair] = useState<MarketPairEnum>(
    defaultContext.selectedMarketPair,
  );

  const [selectedDurations, setSelectedDurations] = useState<number[]>(
    defaultContext.selectedDurations,
  );
  const [selectedParimutuel, setSelectedParimutuel] = useState<string>(
    defaultContext.selectedParimutuel,
  );
  const [positionSide, setPositionSide] = useState<PositionSideEnum>(defaultContext.positionSide);
  const [positionSummaryOption, setPositionSummaryOption] = useState<PositionSummaryOptionEnum>(
    defaultContext.positionSummaryOption,
  );

  const selectDurations = (duration: number) => {
    if (selectedDurations.includes(duration)) {
      if (selectedDurations.length === 1) return;
      const filtered = selectedDurations.filter(
        (selectedDuration) => selectedDuration !== duration,
      );

      setSelectedDurations(filtered);
    } else {
      setSelectedDurations([...selectedDurations, duration]);
    }
  };

  const [decimalPlaces, setDecimalPlaces] = useState<number>(5);

  const [selectedMarketKey, setSelectedMarketKey] = useState<string>("");

  const [livePrice, setLivePrice] = useState<number>(0);

  const [selectedNetwork, setSelectedNetwork] = useState<string>("BONK");

  return (
    <SettingContext.Provider
      value={{
        ...defaultContext,
        selectedMarketPair,
        setSelectedMarketPair,
        selectedDurations,
        setSelectedDurations: selectDurations,
        selectedParimutuel,
        setSelectedParimutuel,
        positionSide,
        setPositionSide,
        positionSummaryOption,
        setPositionSummaryOption,
        decimalPlaces,
        setDecimalPlaces,
        selectedMarketKey,
        setSelectedMarketKey,
        livePrice,
        setLivePrice,
        selectedNetwork,
        setSelectedNetwork
      }}
    >
      {children}
    </SettingContext.Provider>
  );
};

export const useSetting = (): SettingContextProps => {
  const context = useContext(SettingContext);
  if (context === undefined) {
    throw new Error("useSetting must be used within a SettingProvider");
  }
  return context;
};
