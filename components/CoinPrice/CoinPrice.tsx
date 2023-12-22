import React, { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useSetting } from "@contexts/setting";
import { MarketPairEnum } from "@hxronetwork/parimutuelsdk";

interface CoinPriceProps {
  market: string;
}

function truncateToThirdDecimal(num: number): string {
  const truncatedNum = Math.floor(num * 1000) / 1000;
  let formattedNum = truncatedNum.toFixed(3);
  if (truncatedNum >= 1000) {
    formattedNum = truncatedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return formattedNum;
}

const CoinPrice: React.FC<CoinPriceProps> = ({ market }) => {
  const { livePrice, setLivePrice } = useSetting();

  useEffect(() => {
    const ws = new WebSocket("wss://tickingprice-dev.hxro.trade/ws");

    ws.onopen = () => {
      console.log("Websocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const dataMarketPair = data.from_sym + data.to_sym
      if (dataMarketPair == market) {
        setLivePrice(data.price);
      }
    };

    ws.onclose = () => {
      console.log("Websocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [market, setLivePrice]);

  return (
    <Box>
      <Text fontSize="xx-large" mt="-3">
        ${truncateToThirdDecimal(livePrice)}
      </Text>
    </Box>
  );
};

export default CoinPrice;
