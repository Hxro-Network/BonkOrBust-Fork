/* eslint-disable react/prop-types */
// TODO: Re-enable ESLINT for this file
import React, { ReactNode } from "react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import Script from "next/script";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";

import { AccountsProvider } from "@contexts/accounts";
import { GeoProvider } from "@contexts/geo";
import { ModalProvider } from "@contexts/modal";
import { ParimutuelProvider } from "@contexts/parimutuel";
import { SettingProvider } from "@contexts/setting";
import { TokenProvider } from "@contexts/token";
import { WhitelistProvider } from "@contexts/whitelist";
import theme from "@theme/theme";

import "@fontsource/open-sans";
import "@fontsource/roboto";
import "@fontsource/sora";
import { getWeb3Config } from "@constants/config";

const WalletConnectionProvider = dynamic<{ children: ReactNode }>(
  () => import("@contexts/wallet").then(({ WalletConnectionProvider }) => WalletConnectionProvider),
  {
    ssr: false,
  },
);

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {

  return (
    <ChakraProvider theme={theme}>
      <style global jsx>{`
        @font-face {
          font-family: "PixelBoy";
          src: url("/fonts/pixel-boy.ttf") format("truetype");
        }
        @media screen and (max-width: 992px) and (min-width: 500px) {
          .mobile-top-first {
            display: grid !important;
            grid-template-columns: [left-edge] 1fr [middle] 1fr [right-edge] !important;
            grid-template-rows: 100px !important;
          }
          .mobile-logo {
            grid-column-start: left-edge !important;
            grid-column-end: middle !important;
            grid-row: 1 !important;
            margin: auto;
          }
          .mobile-connect-button {
            grid-column-start: middle !important;
            grid-column-end: right-edge !important;
            grid-row: 1 !important;
            max-width: 250px !important;
            margin: auto;
          }
          .mobile-winning-side-text {
            font-size: 40px !important;
            margin-left: 45px !important;
            margin-bot: -5px !important;
          }
          .mobile-is-winning-text {
            font-size: 30px !important;
            margin-left: 15px !important;
          }
          .mobile-header1-text {
            font-size: 35px !important;
          }
          .mobile-header2-text {
            font-size: 30px !important;
          }
          .mobile-header3-text {
            font-size: 25px !important;
          }
          .mobile-position-text {
            font-size: 20px !important;
            margin-left: 15px !important;
          }
          .mobile-small-text {
            font-size: 15px !important;
          }
          .mobile-arrow-img {
            width: 33px;
            margin-left: 5px;
          }
          .mobile-locked-price-text {
            font-size: 25px !important;
            margin-left: 11px !important;
          }
          .mobile-locked-price {
            font-size: 25px !important;
            margin-left: 35px !important;
          }
          .mobile-change-text {
            font-size: 45px !important;
          }
          .mobile-main-grid {
            display: grid !important;
            grid-template-columns: [left-edge] 10px [col1-start] 200px [col1-end] 25px [col2-start] 350px [col2-end] 10px [right-edge] !important;
            grid-template-rows: 180px 300px 180px !important;
          }
          .mobile-slotbox-grid {
            grid-template-columns: 1fr 35px 1fr !important;
          }
          .mobile-bonk-up {
            grid-column-start: col2-start !important;
            grid-column-end: col2-end !important;
            grid-row: 1;
          }
          .mobile-bust-down {
            grid-column-start: col2-start !important;
            grid-column-end: col2-end !important;
            grid-row: 3;
          }
          .mobile-position-img {
            height: 350px !important;
            
          }
          .mobile-slotbox-img {
            height: 350px !important;
          }
          .mobile-position {
            grid-column-start: col1-start;
            grid-column-end: col1-end;
            grid-row: 2;
          }
          .mobile-slotbox {
            grid-column-start: col2-start;
            grid-column-end: col2-end;
            grid-row: 2;
          }

        }
        @media screen and (max-width: 499px) {
          .margin-top-elements {

          }
          .mobile-top-first {
            display: grid !important;
            grid-template-columns: 85vw !important;
            grid-template-rows: 50px 75px !important;
            
          }
          .mobile-logo {
            grid-column: 1 !important;
            grid-row: 1 !important;
            margin: auto;
            max-width: 75vw;
          }
          .mobile-connect-button {
            grid-row: 2 !important;
            max-width: 250px !important;
            margin: auto;
          }
          .mobile-winning-side-text {
            font-size: 40px !important;
            margin-left: 0px !important;
          }
          .mobile-is-winning-text {
            font-size: 25px !important;
            margin-left: 0px !important;
          }
          .mobile-header1-text {
            font-size: 30px !important;
          }
          .mobile-header2-text {
            font-size: 20px !important;
          }
          .mobile-header3-text {
            font-size: 20px !important;
          }
          .mobile-loading-change-text {
            font-size: 30px !important;
            margin-left: -55px
          }
          .mobile-loading-price {
            font-size: 30px !important;
          }
          .mobile-locked-price-text {
            font-size: 25px !important;
            margin-left: 0px !important;
          }
          .mobile-locked-price {
            font-size: 25px !important;
            margin-left: 0px !important;
          }
          .mobile-arrow-img {
            width: 25px;
            margin-left: 5px;
          }
          .mobile-change-text {
            font-size: 40px !important;
          }
          .mobile-main-grid {
            grid-template-columns: [left-edge] 1fr [mid-left-edge] 55px [col1-start] 350px [col1-end] 55px [midright-edge] 1fr [right-edge] !important;
            grid-template-rows: 150px 275px 150px 200px 100px !important;
            margin-top: -25px !important
          }
          .mobile-slotbox-grid {
            grid-template-columns: 1fr 35px 1fr !important;
          }
          .mobile-bonk-up {
            grid-column-start: col1-start !important;
            grid-column-end: col1-end !important;
            grid-row: 1;
          }
          .mobile-bust-down {
            grid-column-start: col1-start !important;
            grid-column-end: col1-end !important;
            grid-row: 3;
          }
          .mobile-position-img {
            content: url('/slot-box.png') !important;
            height: 190px !important;
            width: 375px !important;
            transform: scaleY(-1) !important;
            margin-top: -15px;
          }
          .mobile-slotbox-img {
            height: 300px !important;
            width: 300px !important;
          }
          .mobile-slotbox {
            grid-column-start: col1-start !important;
            grid-column-end: col1-end !important;
            grid-row: 2 !important;
          }
          .mobile-position {
            grid-column-start: left-edge !important;
            grid-column-end: right-edge !important;
            grid-row: 4 !important;
          }

          .mobile-position-grid {
            template-grid-columns: [left-edge] 1fr [middle-l] 10px [middle-r] 1fr [right-edge] !important;
            template-grid-rows: 1fr !important;
            flex-direction: row !important;
            width="390px"
          }
          .mobile-position-first-half {
            grid-column-start: left-edge !important;
            grid-column-end: middle-l !important;
            grid-row: 1 !important;
          }
          .mobile-position-second-half {
            grid-column-start: middle-r !important;
            grid-column-end: right-edge !important;
            grid-row: 1 !important;
            margin-left: 10px !important;
          }
          .mobile-position-outer-box {
            flex-direction: row !important
          }
          .mobile-a-market-text {
            margin-top: 0px;
            margin-left: 5px;
          }
        }
      `}</style>
      <GeoProvider>
        <WhitelistProvider>
          <SettingProvider>
            <TokenProvider>
              <WalletConnectionProvider>
                <AccountsProvider>
                    <ParimutuelProvider>
                      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
                      <ModalProvider>
                        <Script src="/static/datafeeds/udf/dist/polyfills.js" />
                        <Script src="/static/datafeeds/udf/dist/bundle.js" />
                        <Component {...pageProps} />;
                      </ModalProvider>
                    </ParimutuelProvider>
                </AccountsProvider>
              </WalletConnectionProvider>
            </TokenProvider>
          </SettingProvider>
        </WhitelistProvider>
      </GeoProvider>
    </ChakraProvider>
  );
};

export default MyApp;
