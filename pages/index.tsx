import React, { useCallback, useContext, useEffect, useState } from "react";
import type { NextPage } from "next";
import {
  calculateNetOdd,
  ConfigEnum,
  MarketPairEnum,
  ParimutuelWeb3,
  PositionSideEnum
} from "@hxronetwork/parimutuelsdk";
import { Box, Grid, Image, Text, useInterval } from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import ConnectButton from "@components/Button/ConnectButton";
import PositionModal from "@components/PositionModal/PositionModal";
import { ModalContext, useModal } from "@contexts/modal";
import { useSetting } from "@contexts/setting";
import { useBalance } from "@hooks/useBalance";
import { MarketBoardItem, useMarket } from "@hooks/useMarket";

import CoinPrice from "../components/CoinPrice/CoinPrice";
import NavBarContainer from "../components/NavBarContainer/NavBarContainer";
import { Dropdown } from "../components/DropDown/DropDown";
import { useParimutuel } from "@contexts/parimutuel";
import _get from "lodash/get";
import getConfig from "next/config";
import { getWeb3Config } from "@constants/config";

const AmountFormating = (amount: number, fixed: number) => {
  const absAmount = Math.abs(amount);
  let suffix = '';
  let divisor = 1;

  if (absAmount >= 1e9) {
    suffix = 'B';
    divisor = 1e9;
  } else if (absAmount >= 1e6) {
    suffix = 'M';
    divisor = 1e6;
  } else if (absAmount >= 1e3) {
    suffix = 'K';
    divisor = 1e3;
  }

  const formatted = (amount / divisor).toFixed(fixed);
  return `${formatted}${suffix}`;
};

const Home: NextPage = () => {
  const networksArr = ["USDC", "BONK"];
  const usdcMarkets = ["BTC-USD", "SOL-USD"];
  const bonkMarkets = ["SOL-USD"];

  const { connection } = useConnection();
  const {     
    web3,
    setWeb3
  } = useParimutuel();
  const {
    selectedMarketPair,
    setSelectedMarketPair,
    setSelectedParimutuel,
    setPositionSide,
    setDecimalPlaces,
    setSelectedMarketKey,
    livePrice,
    setSelectedNetwork,
    selectedNetwork
  } = useSetting();
  const {
    publicRuntimeConfig: { APP_ENV},
  } = getConfig();

  const { isPositionShown, setIsPositionShown } = useContext(ModalContext);
  const { bonkBalance, usdcBalance } = useBalance();
  const { setIsWalletShown } = useModal();
  const { connected, publicKey } = useWallet();
  const { nextFiveUpcomingParimuels, liveParimutuels, lastParimutuel } = useMarket();

  const handleConnect = useCallback(() => {
    setIsWalletShown(true);
  }, [setIsWalletShown]);
  const handleChange = useCallback(() => setIsWalletShown(true), [setIsWalletShown]);

  const [ourParimutuel, setOurParimutuel] = useState<MarketBoardItem | undefined>(undefined);
  const [ourLockedParimutuel, setOurLockedParimutuel] = useState<MarketBoardItem | undefined>(undefined);
  const [countDownTime, setCountDownTime] = useState<string>("");
  const [locksTime, setLockTime] = useState<number>(0);
  const [longPayout, setLongPayout] = useState<string>("");
  const [shortPayout, setShortPayout] = useState<string>("");
  const [longLockedPayout, setLongLockedPayout] = useState<string>("");
  const [shortLockedPayout, setShortLockedPayout] = useState<string>("");
  const [winningSide, setWinningSide] = useState<string>("");
  const [arrow, setArrow] = useState<string>("");
  const [difference, setDifference] = useState<number>(0);
  const [userPosition, setUserPosition] = useState<string>("");
  const [userLockedPosition, setUserLockedPosition] = useState<string>("");
  const [showUserLost, setShowUserLost] = useState<boolean>(false);
  const [showUserWon, setShowUserWon] = useState<boolean>(false);
  const [marketsArr, setMarketsArr] = useState<string[]>(bonkMarkets);
  const [fixedNetworkDigits, setFixedNetworkDigits] = useState<number>(2);
  const [fixedMarketDigits, setFixedMarketDigits] = useState<number>(3);
  const [lastBonk, setLastBonk] = useState<string>("");
  const [previousPosition, setPreviousPosition] = useState<number[]>([]);
  
  const handleNetworkChange = (value: string) => {
    setSelectedNetwork(value);
    setMarketsArr(value === "USDC" ? usdcMarkets : bonkMarkets);
    const config = getWeb3Config(value);
    const myWeb3 = new ParimutuelWeb3(config, connection);
    setWeb3(myWeb3);
    let myMarket = "BTC-USD";
    if (value === "BONK") {
      setDecimalPlaces(5);
      myMarket = "SOL-USD";
      setFixedNetworkDigits(0);
    } else if (value === "USDC") {
      setDecimalPlaces(6);
      myMarket = "BTC-USD";
      if (APP_ENV === ConfigEnum.DEV) setDecimalPlaces(9);
      setFixedNetworkDigits(2);
    }
    const market_pair = myMarket === "BTC-USD" ? MarketPairEnum.BTCUSD : MarketPairEnum.SOLUSD;
    setSelectedMarketPair(market_pair);
    const market_key = myWeb3
    ? _get(myWeb3?.config.markets, [market_pair, "MARKET_60S"])?.toString()
    : "";
    setSelectedMarketKey(market_key);
    setFixedMarketDigits(selectedMarketPair === MarketPairEnum.SOLUSD ? 3 : 2);
  };


  const handleMarketChange = (value: string) => {
    const market_pair = value === "BTC-USD" ? MarketPairEnum.BTCUSD : MarketPairEnum.SOLUSD;
    setSelectedMarketPair(market_pair);
    const market_key = web3
      ? _get(web3?.config.markets, [market_pair, "MARKET_60S"])?.toString()
      : "";
    setSelectedMarketKey(market_key);
    setFixedMarketDigits(selectedMarketPair === MarketPairEnum.SOLUSD ? 3 : 2);
  };

  useEffect(() => {
    const market_key = web3
      ? _get(web3?.config.markets, [selectedMarketPair, "MARKET_60S"])?.toString()
      : "";
    setSelectedMarketKey(market_key);
  }, []); 

  const bonked_style = {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    flexDirection: "column",
    zIndex: 99999,
  } as object;

  const calculatePnl = (position: number, priceDifference: number, odds: number) => 
  priceDifference > 0 ? position * odds - position : -position;

  const wonOrNot = () => {
    if (lastParimutuel.length === 0) return;

    const { key: { parimutuelPubkey }, position, locked, settled, pool } = lastParimutuel[0];
    const stringKey = parimutuelPubkey.toString();
    const lockedPrice = locked.price;
    const settledPrice = settled.price;
    const longOdds = (pool.poolSize * 0.95) / pool.long;
    const shortOdds = (pool.poolSize * 0.95) / pool.short;
    const priceDifference = settledPrice - lockedPrice;

    if (position.long + position.short <= 0 || stringKey === lastBonk) return;

    let pnl = 0;
    if (position.long > 0) {
        pnl += calculatePnl(position.long, priceDifference, longOdds);
    }
    if (position.short > 0) {
        pnl += calculatePnl(position.short, -priceDifference, shortOdds);
    }

    setLastBonk(stringKey);

    if (pnl === 0) return;

    const winLossStatus = pnl > 0 ? 'WON' : 'LOST';
    const showStatusFunction = pnl > 0 ? setShowUserWon : setShowUserLost;
    showStatusFunction(true);

    setPreviousPosition([position.long, position.short, lockedPrice, settledPrice, pnl]);
    console.log(`USER ${winLossStatus} `, pnl, ` ${selectedNetwork}`);
  };

  function payoutFormating(sideSize: number, poolSize: number, rake: number): string {
    const num = parseFloat(calculateNetOdd(sideSize, poolSize, rake)) * 100;
    const truncatedNum = Math.floor(num * 1000) / 1000;
    let formattedNum = "+" + truncatedNum.toFixed(1) + "%";
    if (truncatedNum >= 1000) {
      formattedNum = "+" + truncatedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "%";
    }
    return formattedNum;
  }

  useInterval(() => {
    setShowUserLost(false);
    setShowUserWon(false);

    const upcoming_bonk_market = nextFiveUpcomingParimuels[0];
    const locked_bonk_market = liveParimutuels[0];

    if (upcoming_bonk_market) {
      setOurParimutuel(upcoming_bonk_market);
      setSelectedParimutuel(upcoming_bonk_market.key.parimutuelPubkey);
      setLockTime(upcoming_bonk_market.time.startTime);

      const longPayout = payoutFormating(
        upcoming_bonk_market.pool.long,
        upcoming_bonk_market.pool.poolSize,
        0.05,
      );
      const shortPayout = payoutFormating(
        upcoming_bonk_market.pool.short,
        upcoming_bonk_market.pool.poolSize,
        0.05,
      );
      setLongPayout(longPayout);
      setShortPayout(shortPayout);

      let user_position = "";
      if (upcoming_bonk_market.position.long > 0) {
        user_position = "BONK: " + AmountFormating(upcoming_bonk_market.position.long, fixedNetworkDigits);
      }
      if (upcoming_bonk_market.position.short > 0) {
        user_position = "BUST: " + AmountFormating(upcoming_bonk_market.position.short, fixedNetworkDigits);
      }
      setUserPosition(user_position);
    }

    if (locked_bonk_market) {
      wonOrNot();
      setOurLockedParimutuel(locked_bonk_market);
      const locked_price = locked_bonk_market.locked.price;
      let diff = livePrice - locked_price;
      if (locked_price == 0 || livePrice == 0) {
        diff = 0;
      }
      setDifference(Math.abs(diff));

      let arrow_img_src = "/up-arrow.png";
      let winning_side = "BONK";
      if (diff < 0) {
        arrow_img_src = "/down-arrow.png";
        winning_side = "BUST";
      }
      setArrow(arrow_img_src);
      setWinningSide(winning_side);
      let user_position = "";
      if (locked_bonk_market.position.long > 0) {
        user_position = "BONK: " + AmountFormating(locked_bonk_market.position.long, fixedNetworkDigits);
      }
      if (locked_bonk_market.position.short > 0) {
        user_position = "BUST: " + AmountFormating(locked_bonk_market.position.short, fixedNetworkDigits);
      }
      setUserLockedPosition(user_position);

      const longPayout = payoutFormating(
        locked_bonk_market.pool.long,
        locked_bonk_market.pool.poolSize,
        0.05,
      );
      const shortPayout = payoutFormating(
        locked_bonk_market.pool.short,
        locked_bonk_market.pool.poolSize,
        0.05,
      );

      setLongLockedPayout(longPayout);
      setShortLockedPayout(shortPayout);
    }
  }, 500);

  useInterval(() => {
    let formattedTime = "00:00:00";
    if (locksTime) {
      let s = locksTime - new Date().getTime();
      const ms = s % 1000;
      s = (s - ms) / 1000;
      const secs = s % 60;
      s = (s - secs) / 60;
      const mins = s % 60;
      const hrs = (s - mins) / 60;

      let formatedSecs = secs.toString();
      let formatedMins = mins.toString();
      let formatedHrs = hrs.toString();

      if (secs < 10) {
        formatedSecs = "0" + secs.toString();
      }
      if (mins < 10) {
        formatedMins = "0" + mins.toString();
      }
      if (hrs < 10) {
        formatedHrs = "0" + hrs.toString();
      }

      formattedTime = formatedHrs + ":" + formatedMins + ":" + formatedSecs;
      if (hrs < 0 || mins < 0 || secs < 0) {
        formattedTime = "00:00:00";
      }
    }
    setCountDownTime(formattedTime);
  }, 1000);

  return (
    <Box
      bg={`url(/bonk-bg.png)`}
      color="white"
      fontFamily="PixelBoy"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      overflow="hidden"
      margin={0}
    >
      {showUserLost && (
        <Box style={bonked_style}>
          <Image src="/bonked-animation.gif" />
          <Text fontSize="9xl" color="red.500">
            YOU LOST
          </Text>
        </Box>
      )}
      {showUserWon && (
        <Box style={bonked_style}>
          <Image src="/user-won-animation.gif" />
          <Text fontSize="9xl" color="green.500" mt="-120px">
            YOU WON
          </Text>
        </Box>
      )}
      <Box className="mobile-top-elements">
        <NavBarContainer>
          <Image
            className="mobile-logo"
            gridColumnStart="left-edge"
            gridColumnEnd="middle"
            gridRow="1"
            src="/bonk-logo.png"
            alt="Logo"
          />
          <ConnectButton
            className="mobile-connect-button"
            gridColumnStart="middle"
            gridColumnEnd="right-edge"
            gridRow="1"
            isConnected={connected}
            publicKey={publicKey?.toString()}
            ml="auto"
            onClickConnect={handleConnect}
            onClickChange={handleChange}
          />
        </NavBarContainer>
        <Box
          className="mobile-top-second"
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          mt={-12}
        >
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gap={5}
            placeItems={{ base: "center", md: "initial" }}
            placeContent={{ base: "center", md: "initial" }}
          >
            <Box>
              <Dropdown
                title={`Selected Settlement: ${selectedNetwork}`}
                options={networksArr}
                onSelect={(option) => {
                  handleNetworkChange(option);
                }}
              />
            </Box>
            <Box>
              <Dropdown
                title={`Selected Market: ${selectedMarketPair}`}
                options={marketsArr}
                onSelect={(option) => {
                  handleMarketChange(option);
                }}
              />
            </Box>
          </Grid>
          <Text fontSize="x-large" color="#FCD014" mt={3}>
            Balance:
          </Text>
          <Text fontSize="xxx-large" mt={-5}>
            {AmountFormating(
              selectedNetwork === "BONK" ? bonkBalance.cryptoAmount : usdcBalance.cryptoAmount,
              fixedNetworkDigits
            )}{" "}
            {selectedNetwork}
          </Text>
        </Box>
      </Box>

      <Box display="flex" alignItems="center" margin="auto" justifyContent="center">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="row"
          maxWidth="full"
        >
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
            <Box mt={0}>
              <Grid
                className="mobile-main-grid"
                templateColumns="2fr 2fr 2fr"
                templateRows="180px 375px 180px"
                alignItems="center"
                mt="-62px"
                justifyContent="center"
              >
              <Box
                className="mobile-bonk-up"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gridColumn="2/3"
                gridRow="1"
                mb="-75px"
              >
                <button
                  onClick={() => {
                    setIsPositionShown(true);
                    setPositionSide(PositionSideEnum.LONG);
                  }}
                >
                  <Image src="/bonk-up.png" alt="bonkup" _hover={{ height: 185, mb: "5px" }} />
                </button>
              </Box>
              <Box
                className="mobile-position"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gridRow="2"
              >
                <Image
                  src="/locked-slot-box.png"
                  alt="locked slot box"
                  className="mobile-position-img"
                  height="400px"
                  width="250px"
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                />
                <Box
                  className="mobile-position-grid"
                  position="absolute"
                  zIndex={3}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  color="black"
                >
                  <Box
                      className="mobile-position-outer-box"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                    >
                      <Box className="mobile-position-first-half">
                        {difference ? (
                          <Text
                            className="mobile-winning-side-text"
                            ml="50px"
                            fontSize="4xl"
                            mt="-20px"
                            color="#FCD215"
                          >
                            {winningSide}
                          </Text>
                        ) : (
                          <Text
                            className="mobile-header1-text"
                            ml="25px"
                            fontSize="4xl"
                            mt="-20px"
                          >
                            Bonking
                          </Text>
                        )}
                        {difference ? (
                          <Text
                            className="mobile-is-winning-text"
                            ml="10px"
                            fontSize="4xl"
                            mt="-20px"
                          >
                            is Winning
                          </Text>
                        ) : (
                          <Text
                            className="mobile-header1-text"
                            ml="5px"
                            fontSize="4xl"
                            mt="-20px"
                          >
                            is Busting
                          </Text>
                        )}
                        <Grid
                          className="mobile-change-content"
                          templateColumns="1fr 1fr" // Adjusts the column widths
                          alignItems="center"
                          mt="-25px"
                        >
                          {difference ? (
                            <Image className="mobile-arrow-img" src={arrow} />
                          ) : (
                            <Box mr="-0"></Box>
                          )}
                          {difference ? (
                            <Text className="mobile-change-text" fontSize="5xl" ml="-35px">
                              {"$" +
                                AmountFormating(
                                  difference,
                                  fixedMarketDigits,
                                )}
                            </Text>
                          ) : (
                            <Text
                              className="mobile-loading-change-text"
                              fontSize="4xl"
                              ml="-65px"
                              color="gray.400"
                            >
                              Loading...
                            </Text>
                          )}
                        </Grid>
                        <Text
                          className="mobile-locked-price-text"
                          fontSize="2xl"
                          ml="10px"
                          mt="-20px"
                        >
                          Locked Price:
                        </Text>
                        {difference && ourLockedParimutuel ? (
                          <Text
                            className="mobile-locked-price"
                            fontSize="4xl"
                            ml="15px"
                            mt="-20px"
                          >
                            {"$ " +
                              (
                                Math.round(ourLockedParimutuel.locked.price * 1000) / 1000
                              ).toFixed(3)}
                          </Text>
                        ) : (
                          <Text
                            className="mobile-loading-price"
                            fontSize="4xl"
                            mt="-20px"
                            ml="15px"
                            color="gray.400"
                          >
                            Loading...
                          </Text>
                        )}
                      </Box>

                      <Box className="mobile-position-second-half">
                        <Grid templateColumns="1fr 1fr" alignItems="center" mt="-15px">
                          <Box mr="10px">
                            <Text fontSize="l">Bonk Pool:</Text>
                            {ourLockedParimutuel ? (
                              <Text className="mobile-header3-text" mt="-7px" fontSize="xl">
                                {AmountFormating(ourLockedParimutuel.pool.long, fixedNetworkDigits)}
                              </Text>
                            ) : (
                              <Text className="mobile-small-text" mt="-7px" fontSize="xl">
                                Bonking...
                              </Text>
                            )}
                            <Text fontSize="l">bonk payout:</Text>
                            {longLockedPayout ? (
                              <Text className="mobile-header3-text" mt="-7px" fontSize="xl">
                                {longLockedPayout}
                              </Text>
                            ) : (
                              <Text className="mobile-small-text" mt="-7px" fontSize="xl">
                                Bonking...
                              </Text>
                            )}
                          </Box>
                          <Box ml="10px">
                            <Text fontSize="l">Bust Pool:</Text>
                            {ourLockedParimutuel ? (
                              <Text className="mobile-header3-text" mt="-7px" fontSize="xl">
                                {AmountFormating(ourLockedParimutuel.pool.short, fixedNetworkDigits)}
                              </Text>
                            ) : (
                              <Text className="mobile-small-text" mt="-7px" fontSize="xl">
                                Busting...
                              </Text>
                            )}
                            <Text fontSize="l">bust payout:</Text>
                            {shortLockedPayout ? (
                              <Text className="mobile-header3-text" mt="-7px" fontSize="xl">
                                {shortLockedPayout}
                              </Text>
                            ) : (
                              <Text className="mobile-small-text" mt="-7px" fontSize="xl">
                                Busting...
                              </Text>
                            )}
                          </Box>
                        </Grid>
                        <Text
                          className="mobile-position-text"
                          style={{ display: userPosition ? "block" : "none" }}
                          fontSize="2xl"
                          ml="5px"
                          mt="-5px"
                          color="red.600"
                        >
                          Your Position
                        </Text>
                        <Text fontSize="xl" mt="-10px">
                          {userLockedPosition}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box
                  className="mobile-slotbox"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gridRow="2"
                >
                  <Image
                    src="/slot-box.png"
                    alt="slotbox"
                    className="mobile-slotbox-img"
                    height="400px"
                    zIndex={2}
                  />

                  <Box
                    position="absolute"
                    zIndex={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                    color="black"
                  >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexDirection="column"
                      >
                      <Text
                        className="mobile-header1-text"
                        fontSize="xx-large"
                        color="#FCD215"
                        mt={-4}
                      >
                        {selectedMarketPair}
                      </Text>
                      <Box mt="-5px">
                        <CoinPrice market={selectedMarketPair} />
                      </Box>
                      <Grid
                        className="mobile-slotbox-grid"
                        templateColumns="repeat(3, 1fr)"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Box alignItems="center" justifyContent="center">
                          <Text className="mobile-header3-text" fontSize="x-large" mt={0}>
                            Bonk Pool:
                          </Text>
                          <Text className="mobile-header3-text" fontSize="x-large" mt={0}>
                            {ourParimutuel
                              ? AmountFormating(ourParimutuel.pool.long, fixedNetworkDigits)
                              : "Bonking..."}
                          </Text>
                          <Text className="mobile-header3-text" fontSize="x-large" mt={0}>
                            bonk payout:
                          </Text>
                          <Text className="mobile-header3-text" fontSize="x-large" mt={-2}>
                            {longPayout ? longPayout : "Bonking..."}
                          </Text>
                        </Box>
                        <Box></Box>
                        <Box alignItems="center" justifyContent="center">
                          <Text className="mobile-header3-text" fontSize="x-large" mt={0}>
                            BUST Pool:
                          </Text>
                          <Text className="mobile-header3-text" fontSize="x-large" mt={0}>
                            {ourParimutuel
                              ? AmountFormating(ourParimutuel.pool.short, fixedNetworkDigits)
                              : "Busting..."}
                          </Text>
                          <Text className="mobile-header3-text" fontSize="x-large" mt={0}>
                            bust payout:
                          </Text>
                          <Text className="mobile-header3-text" fontSize="x-large" mt={-2}>
                            {shortPayout ? shortPayout : "Busting..."}
                          </Text>
                        </Box>
                      </Grid>
                      <Grid
                        style={{ display: userPosition ? "block" : "none" }}
                        templateColumns="1fr 1fr"
                        justifyItems="center"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Box alignItems="center" justifyContent="center">
                          <Text fontSize="x-large" color="red.500">
                            Your position:
                          </Text>
                        </Box>
                        <Box alignItems="center" justifyContent="center">
                          <Text fontSize="x-large">{userPosition ? userPosition : "0.0"}</Text>
                        </Box>
                      </Grid>
                      <Text className="mobile-header3-text" fontSize="xx-large" mt="-8px">
                        Bet goes live in: {countDownTime}
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Box
                  className="mobile-bust-down"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gridColumn="2/3"
                  gridRow="3"
                  mt="-75px"
                >
                  <button
                    onClick={() => {
                      setIsPositionShown(true);
                      setPositionSide(PositionSideEnum.SHORT);
                    }}
                  >
                    <Image
                      src="/bust-down.png"
                      alt="bonkup"
                      zIndex={1}
                      _hover={{ height: 185, mt: " 5px " }}
                    />
                  </button>
                </Box>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>

      {isPositionShown && <PositionModal />}
    </Box>
  );
};

export default Home;

