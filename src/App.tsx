import './App.css'
import { TonConnectButton } from '@tonconnect/ui-react';
import { useFortuneCookieNftCollectionContract } from './hooks/useFortuneCookieNftCollectionContract';
import { useTonConnect } from './hooks/useTonConnect';
import { CopyButton } from './components/CopyButton';
import WebApp from '@twa-dev/sdk';

function App() {
  const isInTWA = WebApp.platform != "unknown";

  const {
    contractAddress: collectionAddress,
    contractBalance: collectionBalance,
    contractData: collectionData,
    sendMint,
    sendDeposit,
    sendEditContent,
    refresh: getCollectionData,
  } = useFortuneCookieNftCollectionContract();
  
  const { connected } = useTonConnect();

  if (isInTWA) WebApp.expand();
  
  return <div id="content">
    <header className="header">
      <b style={{marginLeft: 'auto', color: '#f00'}}>TESTNET{isInTWA ? " - " + WebApp.platform : ""}</b>
      <TonConnectButton className="ton-connect-button" />
    </header>
    <div className="main">
      <div className="card"> 
        <div className="card-header">
          <span>Collection contract</span>
          <button className="card-header-button" onClick={() => {
            getCollectionData();
          }}>
            Refresh
          </button>
        </div>
        <div className="card-item">
          <div className="card-item-title">
            Address
          </div>
          <div className="card-item-value card-item-container">
            <span>{collectionAddress?.slice(0, 30) + "..."}</span>
            <CopyButton onClick={() => {
              navigator.clipboard.writeText(collectionAddress ?? "");
            }} />
          </div>
        </div>

        {collectionBalance !== null &&
          <div className="card-item">
            <div className="card-item-container">
              <div>
                <div className="card-item-title">
                  Balance
                </div>
                <div className="card-item-value">
                  {collectionBalance} TON
                </div>
              </div>
              {connected && (
              <button className="card-item-button" onClick={() => {
                const value = prompt("Enter amount to deposit", "0");
                if (value === null || value == "") return;
                else {
                  const amount = parseFloat(value);
                  sendDeposit(amount);
                }
              }}>
                Deposit
              </button>
              )}
            </div>
          </div>
        }
        <div className="card-item">
          <div className="card-item-container">
            <div>
              <div className="card-item-title">
                Next item ID
              </div>
              <div className="card-item-value">
                {collectionData?.nextItemId ?? "unknown"}
              </div>
            </div>
            {connected && (
              <button className="card-item-button" onClick={() => {
                sendMint();
              }}>
                Mint
              </button>
            )}
          </div>
        </div>
        <div className="card-item">
          <div className="card-item-container">
            <div>
              <div className="card-item-title">
                Collection content
              </div>
              <div className="card-item-value">
                {collectionData?.content ?? "unknown"}
              </div>
            </div>
            {connected && (
              <button className="card-item-button" onClick={() => {
                const newUrl = prompt("Enter new url", collectionData?.content ?? "");
                sendEditContent(newUrl ?? "");
              }}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export default App;
