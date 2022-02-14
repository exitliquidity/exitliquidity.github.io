import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Button, Col, Menu, Row, Input, Select } from "antd";
const { Option } = Select;
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Switch, useParams } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor, getURLParam } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useExternalContractLoader,
  useEventListener,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserProvider,
} from "./hooks";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";

import PillzABI from "./contracts/Pillz.abi";
//import PillzAddress from "./contracts/Pillz.address";
import { formatEther, formatUnits, parseEther } from "ethers/lib/utils";

import P5Wrapper from 'react-p5-wrapper';
import pillSketch from "./sketch";


const { ethers, BigNumber } = require("ethers");


import { create as createIPFSClient } from 'ipfs-http-client';
const ipfsClient = createIPFSClient('https://ipfs.infura.io:5001')
const PillzAddress = "0xf76ef263AB364fF3bF5A332fE8Fe8a6E879EFa2E";
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.arbitrum; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544") : null;
const poktMainnetProvider = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406") : null;
const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I )

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: 'coinbase',
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(
  `https://mainnet.infura.io/v3/${INFURA_ID}`,
  1,
);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "arbitrum", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai,
          41261: "https://arb1.arbitrum.io/rpc"
        },
      },

    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    'custom-walletlink': {
      display: {
        logo: 'https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0',
        name: 'Coinbase',
        description: 'Connect to Coinbase Wallet (not Coinbase App)',
      },
      package: walletLinkProvider,
      connector: async (provider, options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    }
  },
});



function App(props) {
  const mainnetProvider = poktMainnetProvider && poktMainnetProvider._isProvider ? poktMainnetProvider : scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [showModal, setShowModal] = useState();
  const [loading, setLoading] = useState();
  const [toName, setToName] = useState("");
  const [fromName, setFromName] = useState("");
  const [textColor, setTextColor] = useState("black");
  const [fontName, setFontName] = useState("sans-serif");
  const [styleName, setStyleName] = useState("apu");
  const [recepient, setRecpient] = useState("");
  let ref = getURLParam("ref");
  let view = getURLParam("view");
  if (!ref) {
    ref = "0x0000000000000000000000000000000000000000";
  }
  if (!view) {
    view = 0;
  }
  console.log(`ref is ${ref}`);



  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserProvider(injectedProvider, localProvider);
console.log(injectedProvider);
  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
        setRecpient(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);


  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(userSigner);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  const pillzInstance = useExternalContractLoader(injectedProvider, PillzAddress, PillzABI);
console.log(`pillzInstance ${pillzInstance}`);
  // keep track of a variable from the contract in the local React state:
  const maxSupply = useContractReader({ Pillz: pillzInstance }, "Pillz", "maxSupply");
  console.log(`max supply is ${maxSupply}`);
  const mintedSoFar = useContractReader({ Pillz: pillzInstance }, "Pillz", "minted");
  console.log(`mintedSoFar is ${mintedSoFar}`);


  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose");

  // 📟 Listen for broadcast events
  const setPurposeEvents = useEventListener(readContracts, "YourContract", "SetPurpose", localProvider, 1);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
   /*    console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("📝 readContracts", readContracts);
      console.log("🔐 writeContracts", writeContracts);
      console.log("🔐 selectedChainId", selectedChainId); */
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);
                    const tx = await ethereum.request({ method: "wallet_addEthereumChain", params: data }).catch();
                    if (tx) {
                      console.log(tx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
                .
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }


  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;


  console.log(`userProvdier is ${userSigner}`);
  console.log(userSigner);
  console.log(`address is ${address}`);

  function addTextToImage(name1, text1, text2, font1) {
    var circle_canvas = document.getElementById("canvas");
    var context = circle_canvas.getContext("2d");
    context.clearRect(0, 0, circle_canvas.width, circle_canvas.height);
    // Draw Image function
    var img = new Image();
    img.src = "./" + name1 + ".png";
    img.onload = async function () {
      context.drawImage(img, 0, 0);
      context.lineWidth = 1;
      context.fillStyle = textColor;
      context.lineStyle = "#ffff00";
      context.font = "100px " + font1;
      context.fontWeight = "bold";
      context.fillText(text1, 1478, 675);
      context.fillText(text2, 1540, 990);

      var data = document.getElementById("canvas").toDataURL();
      //console.log(data);
      console.log("data above")
      document.getElementById("imag").src = data;
      console.log("data set");
      /* 
      const imageUpload = await ipfsClient.add(data);
      const imagePath = `https://ipfs.io/ipfs/${imageUpload.path}`;
      console.log("ipfs url");
      console.log(imagePath); */
    };

  }





  function handleStyleChange(value) {
    console.log(`selected ${value}`);
    setStyleName(value);

    addTextToImage(value, toName, fromName, fontName);
  }

  function handleSelectChange(value) {
    console.log(`selected ${value}`);
    setFontName(value);

    addTextToImage(styleName, toName, fromName, value);
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      {/* <Header /> */}
      {networkDisplay}
      <BrowserRouter>


        <div id="overlay" style={{ display: showModal ? "block" : "none" }} onClick={() => setShowModal(false)}>
        </div>

        <Switch>
          <Route exact path="/">
            {parseInt(view) >= 1 && parseInt(view)  <= 69 ?
          /* show view page */  
          <ViewPage injectedProvider={injectedProvider} id={parseInt(view)}/>
        
        :
        /* show mint page */

        <>
        <img src="./apu.png" id="imag" style={{ objectFit: "cover", width: "100%" }} />
   
          <div style={{ margin: "4%", padding: "1%", backgroundColor: "#FF94C9", color: "white", height: "40%" }}>
            <h1 style={{ color: "white" }}>Treat Your Valentine</h1>

            <p>{formatUnits(mintedSoFar ? mintedSoFar : "0", "wei")}/{formatUnits(maxSupply ? maxSupply : "0", "wei")} unique card gifts</p>

            <label>Font:</label>
            <Select defaultValue="sans-serif" style={{ width: 120 }} onChange={handleSelectChange}>
              <Option value="sans-serif">Sans-Serif</Option>
              <Option value="lobster">Lobster</Option>
              <Option value="Comic">Comic Sans</Option>
              <Option value="monospace">Courier</Option>
            </Select>

            <div style={{ height: "10px" }}></div>
            <Input
              placeholder={'To'}
              backgroundColor="white"
              value={toName}
              onChange={(e) => {
                //localStorage.clear();
                setToName(e.target.value)

                addTextToImage(styleName, e.target.value, fromName, fontName);
              }}
            />
            <div style={{ height: "10px" }}></div>
            <Input
              placeholder={'From'}
              backgroundColor="white"
              value={fromName}
              onChange={(e) => {
                //localStorage.clear();
                setFromName(e.target.value)

                addTextToImage(styleName, toName, e.target.value, fontName);
              }}
            />
            <div style={{ height: "10px" }}></div>
            <label>Style:</label>

            <Select defaultValue="apu" style={{ width: 120 }} onChange={handleStyleChange}>
              <Option value="apu">Apu</Option>
              <Option value="kanna">Kanna</Option>
              <Option value="simp">Simp</Option>
            </Select>

            <div style={{ height: "10px" }}></div>

            <label>
              What address do you want the NFT sent to? By default it will be sent to your's.
            </label>
            <br />
            <Input
              placeholder={'To'}
              backgroundColor="white"
              value={recepient}
              onChange={(e) => {
                //localStorage.clear();
                setRecpient(e.target.value)

              }}
            />


            <p><b>1 Card = 0.03Ξ</b></p>
            {!loading ?
              (injectedProvider ?
                <Button onClick={async () => {
                  setLoading(true);

                  addTextToImage(styleName, toName, fromName, fontName);
                         var dt = {image:document.getElementById("imag").src, attributes: {from: fromName, to: toName, font: fontName, style: styleName}, name: `V Card #${parseInt(mintedSoFar)+1}`};
                         
                         const imageUpload = await ipfsClient.add(document.getElementById("imag").src);
                         const imagePath = `https://ipfs.io/ipfs/${imageUpload.path}`;
                         dt.image = imagePath;
                         const { path } = await ipfsClient.add(JSON.stringify(dt));

                         console.log(`deployed to ${path}`);
                         



                  // localStorage.clear();
                   
                  
                                        console.log(`uploaded to ipfs`);
                                        console.log(`https://ipfs.io/ipfs/${path}`); 
                       const data = pillzInstance.interface.encodeFunctionData("mint", [recepient, path, ref]);        
                      tx(
                       userSigner.sendTransaction({
                           to: PillzAddress,
                           data: data,
                           value: parseEther((0.03).toString()),
                       }),
                       );   
                  setLoading(false);



                }}>😍Mint🥰</Button>
                :
                <div onClick={() => setShowModal(false)}>
                  <Account
                    address={address}
                    localProvider={localProvider}
                    userSigner={userSigner}
                    mainnetProvider={mainnetProvider}
                    price={price}
                    web3Modal={web3Modal}
                    loadWeb3Modal={loadWeb3Modal}
                    logoutOfWeb3Modal={logoutOfWeb3Modal}
                    blockExplorer={blockExplorer}
                  />
                </div>
              )
              : <>Loading...</>
            }

            <div style={{ display: "none" }}>
              
            </div>
            <br />
            <br />

            <br />
            <canvas id="canvas" width="2162" height="1198" style={{ opacity: "0%", display: "none" }} />

            <br />
            {injectedProvider ?
              <p>Want to earn <b>25%</b> of each sale? Heres a referral link just for you:<br />
                <a style={{ color: "black" }} href={`https://exitliquidity.art/?ref=${address}`}>{`https://exitliquidity.art/?ref=${address}`}</a></p>
              : <></>}

          </div>
              <button onClick={() => {
                alert(" Data for these NFTs are stored on the IPFS network as PNG files encoded as Base64 strings")
              }}>Disclaimers</button>
          <p style={{ color: "black" }}>Created By: <a href="https://twitter.com/0xPuffin">0xPuffin🐧</a> | 2022</p>

        </>
        }
          </Route>

          <Route path="/view/:id">
            <ViewPage injectedProvider={injectedProvider}/>
          </Route>

        </Switch>
      </BrowserRouter>


    </div>
  );
}

function ViewPage(props) {
  const {injectedProvider} = props;
  console.log(injectedProvider);
  console.log(props);
  console.log("viewpage");
  //const {id} = useParams();
const id = props.id;
  const [data, setData] = useState();
  const [image, setImage] = useState();
  const userSigner = useUserProvider(injectedProvider, localProvider);
  const readContracts = useContractLoader(userSigner);
  const pillzInstance = useExternalContractLoader(injectedProvider, PillzAddress, PillzABI);
  console.log(`pillzInstance ${pillzInstance}`);
    // keep track of a variable from the contract in the local React state:
    const dataUri = useContractReader({ Pillz: pillzInstance }, "Pillz", "tokenURI", [id]);
    console.log(`data uri is ${dataUri}`)
    console.log(`body is ${data}`);
    console.log(data);
   

  useEffect(() => {
    async function getData() {
      if (dataUri) {

  const response = await fetch("https://ipfs.io/ipfs/"+dataUri);
  console.log(`data is =================================**********`);
  const body = await response.json();
  console.log(body);
  setData(body);

  const imageData = await fetch(body.image);
  const imageBody = await imageData.text();
console.log(`imageData ${imageBody} 🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧`)
  console.log(imageData.body);
  setImage(imageBody);

      }
    }
    getData();
  }, [dataUri]);

    
    if (!injectedProvider) {
      return ("Please Visit the main page to connect your wallet to view your Card");
    } 
  return (
    
    <>Viewing: {data ? data.name: id}
    {data ?
    <>
    <p>To: {data.attributes.to}</p>
    <p>from: {data.attributes.from}</p>
    <img src={image} style={{width: "100%"}}/>
    </>:
    <></>}
    </>
  )
}

export default App;
