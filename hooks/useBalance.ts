import { useEffect, useMemo, useState } from "react";
import { CryptoEnum, MarketPairEnum } from "@hxronetwork/parimutuelsdk";

import { getWeb3Config } from "@constants/config";
import { useParimutuel } from "@contexts/parimutuel";
import { useAccounts } from "@hooks/useAccounts";
import { useMint } from "@hooks/useMint";
import { fromLamports } from "@utils/mint";
import { getCryptoAbbr, getCryptoAddress } from "@utils/utils";
import { useSetting } from "@contexts/setting";

type Balance = {
  cryptoAmount: number;
  usdAmount: number;
};

export const useBalance = () => {
  const { traderFeePayerAccount } = useParimutuel();
  const { accountByMint } = useAccounts();
  const { selectedNetwork } = useSetting();

  const [solBalance, setSolBalance] = useState<Balance>({ cryptoAmount: 0, usdAmount: 0 });
  const [usdcBalance, setUsdcBalance] = useState<Balance>({ cryptoAmount: 0, usdAmount: 0 });
  const [hxroBalance, setHxroBalance] = useState<Balance>({ cryptoAmount: 0, usdAmount: 0 });
  const [bonkBalance, setBonkBalance] = useState<Balance>({ cryptoAmount: 0, usdAmount: 0 });
  const [traderAccountHxroBalance, setTraderAccountHxroBalance] = useState<Balance>({
    cryptoAmount: 0,
    usdAmount: 0,
  });


  const { HXRO_MINT, USDC_MINT, BONK_MINT } = getWeb3Config(selectedNetwork);

  // TODO: Add price for bonk for consistency
  // const bonkPrice = useMemo(() => {
  //   const price = priceMap[Ma]
  // })

  const solAbbr = getCryptoAbbr(CryptoEnum.SOLANA);

  // TODO: different env get from different source
  const solAddress = getCryptoAddress(solAbbr);
  const usdcAddress = USDC_MINT.toString();
  const hxroAddress = HXRO_MINT.toString();
  const bonkAddress = BONK_MINT.toString();

  const solMint = useMint(solAddress);
  const hxroMint = useMint(hxroAddress);
  const usdcMint = useMint(usdcAddress);
  const bonkMint = useMint(bonkAddress);

  const solAccount = useMemo(() => accountByMint.get(solAddress), [accountByMint, solAddress]);
  const hxroAccount = useMemo(() => accountByMint.get(hxroAddress), [accountByMint, hxroAddress]);
  const usdcAccount = useMemo(() => accountByMint.get(usdcAddress), [accountByMint, usdcAddress]);
  const bonkAccount = useMemo(() => accountByMint.get(bonkAddress), [accountByMint, bonkAddress]);

  useEffect(() => {
    // sol balance
    if (solAccount) {
      const cryptoAmount = fromLamports(solAccount, solMint);
      const usdAmount = 0;
      setSolBalance({ cryptoAmount, usdAmount });
    }

    // usdc balance
    if (usdcAccount) {
      const cryptoAmount = fromLamports(usdcAccount, usdcMint);
      setUsdcBalance({ cryptoAmount, usdAmount: cryptoAmount });
    }

    // hxro balance
    if (hxroAccount) {
      const cryptoAmount = fromLamports(hxroAccount, hxroMint);
      const usdAmount = 0;
      setHxroBalance({ cryptoAmount, usdAmount });
    }

    // bonk balance
    if (bonkAccount) {
      const cryptoAmount = fromLamports(bonkAccount, bonkMint);
      const usdAmount = 0;
      setBonkBalance({ cryptoAmount, usdAmount });
    }

    if (traderFeePayerAccount) {
      const cryptoAmount = fromLamports(traderFeePayerAccount.info.tokenAccount, hxroMint);
      const usdAmount = 0;
      setTraderAccountHxroBalance({ cryptoAmount, usdAmount });
    }
  }, [traderFeePayerAccount, solAccount, hxroAccount, usdcAccount, hxroMint, solMint, usdcMint]);

  return {
    solBalance,
    usdcBalance,
    hxroBalance,
    bonkBalance,
    traderAccountHxroBalance,
  };
};
