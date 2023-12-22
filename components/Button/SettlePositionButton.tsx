import React, { useCallback } from "react";
import { WalletSigner } from "@hxronetwork/parimutuelsdk";
import { Button, ButtonProps, Text } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { useParimutuel } from "@contexts/parimutuel";
import { useSetting } from "@contexts/setting";

export type UpdatePositionButtonProps = ButtonProps & {
  parimutuelPubkey: string;
};

export const SettlePositionButton: React.FC<UpdatePositionButtonProps> = ({
  parimutuelPubkey,
  ...restProps
}) => {
  const wallet = useWallet();
  const { settled, setSettled, web3 } = useParimutuel();

  const handleSettlePosition = useCallback(async () => {
    if (!wallet.publicKey) return;

    const result = await web3?.settlePosition(
      wallet as WalletSigner,
      wallet.publicKey,
      new PublicKey(parimutuelPubkey),
    );

    if (result) {
      setSettled([...settled, parimutuelPubkey]);
    }
  }, [wallet, web3, parimutuelPubkey, setSettled, settled]);

  return (
    <>
      <Button
        border="1px"
        borderRadius="4px"
        borderColor="green.400"
        bgColor="green.400"
        width="50%"
        height="42px"
        _hover={{ bgColor: "transparent", borderColor: "brand.300" }}
        {...restProps}
        onClick={handleSettlePosition}
      >
        <Text textStyle="small" color="white">
          Settle
        </Text>
      </Button>
    </>
  );
};

export default SettlePositionButton;
