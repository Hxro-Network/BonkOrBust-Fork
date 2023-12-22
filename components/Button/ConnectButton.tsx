import React from "react";
import { shortenAddress } from "@hxronetwork/parimutuelsdk";
import {
  Box,
  Button,
  ButtonGroup,
  ButtonGroupProps,
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";

import dotSvg from "@public/images/dot.svg";

export type ConnectButtonProps = ButtonGroupProps & {
  isConnected: boolean;
  publicKey?: string;
  onClickConnect: () => void;
  onClickChange: () => void;
};

const ConnectButton: React.FC<ConnectButtonProps> = ({
  isConnected,
  onClickConnect,
  onClickChange,
  publicKey,
  ...restProps
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const open = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  return (
    <>
      <ButtonGroup isAttached {...restProps}>
        <Button
          // New BONK styling
          bg="#FCD014"
          width="xs"
          height="12"
          maxWidth="xs"
          minHeight="8"
          borderRadius="md"
          _hover={{ bg: "#F06916" }}
          _active={{ bg: "#F06916" }}
          // Original styling
          mr="-0px"
          padding="0px"
          onClick={onClickConnect}
        >
          <Text
            // New BONK styling
            fontFamily="PixelBoy"
            // Original styling 
            textStyle="accent"
            fontSize="xx-large"
            fontWeight="bold" 
            color="black"
          >
            {publicKey ? shortenAddress(publicKey) : "Connect Wallet"}
          </Text>
        </Button>
        <Popover
          returnFocusOnClose={false}
          isOpen={isOpen}
          onClose={close}
          placement="bottom-end"
          closeOnBlur={true}
        >
          <PopoverTrigger>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              as="button"
              border="1px"
              borderRadius="4px"
              borderColor={isConnected ? "green.400" : "gray.50"}
              borderLeftColor={isConnected ? "green.400" : "transparent"}
              bgColor="transparent"
              width="36px"
              height="48px"
              _hover={{
                bgColor: "transparent",
                borderColor: isConnected ? "green.300" : "gray.300",
              }}
              onClick={open}
            >
              <Image height="36px" width="16px" src={dotSvg} alt="dot" />
            </Box>
          </PopoverTrigger>
          <PopoverContent
            bgColor="brand.100" 
            border="0px" 
            borderRadius="0px" 
            width="130px">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              as="button"
              border="0px"
              bgColor="transparent"
              _hover={{
                bgColor: "transparent",
              }}
              onClick={onClickChange}
            >
              <Text textStyle="regular" color="white">
                Change Wallet
              </Text>
            </Box>
          </PopoverContent>
        </Popover>
      </ButtonGroup>
    </>
  );
};

export default ConnectButton;
