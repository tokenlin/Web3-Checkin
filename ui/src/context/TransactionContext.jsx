import { useEffect, useState, createContext } from "react"
import { ethers, AbiCoder } from "ethers"

import { contractABI, contractAddress } from "../utils/constants"
import dayjs from "dayjs"

export const TransactionContext = createContext()

const { ethereum } = window

async function createEthereumContract() {
    const provider = new ethers.BrowserProvider(ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, contractABI, signer)
}

export function TransactionsProvider({ children }) {
    const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" })
    const [currentAccount, setCurrentAccount] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"))
    const [transactions, setTransactions] = useState([])
    const [myTransactions, setMyTransactions] = useState([])

    function handleChange(e, name) {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }))
    }

    async function getAllTransactions() {
        const abi = new AbiCoder()
        try {
            const transactionsContract = await createEthereumContract()
            const transactions = await transactionsContract.getAllCheckinPoints()
            const list = []
            console.log("getAllTransactions", transactions)
            for (const transaction of transactions) {
                const transactor = abi.decode(["uint32", "uint64", "uint64", "uint32", "uint32", "uint32", "address", "string", "string", "bool"], transaction)
                // console.log("getAllTransactions");
                console.log(transactor);
                list.push({
                    sn: transactor[0].toString(),
                    startTime: dayjs(new Date(parseInt(transactor[1].toString()) * 1000)).format("YYYY-MM-DD HH:mm:ss"),
                    endTime: dayjs(new Date(parseInt(transactor[2].toString()) * 1000)).format("YYYY-MM-DD HH:mm:ss"),
                    longitude: parseFloat(transactor[3].toString()) / 1000000,
                    latitude: parseFloat(transactor[4].toString()) / 1000000,
                    deviation: parseFloat(transactor[5].toString()) / 1000000,
                    owner: transactor[6],
                    description: transactor[7],
                    city: transactor[8],
                    checked: transactor[9],
                })
            }
            setTransactions(list)
        } catch (error) {
            console.log(error)
        }
    }

    async function getMyTransactions() {
        const abi = new AbiCoder()
        try {
            const transactionsContract = await createEthereumContract()
            const transactions = await transactionsContract.getCheckinInfosByAddress()
            const list = []
            console.log("getMyTransactions", transactions)
            for (const transaction of transactions) {
                const transactor = abi.decode(["uint32", "uint64", "uint64", "uint32", "uint32", "uint32", "address", "string", "string"], transaction)
                // console.log("getMyTransactions");
                // console.log(transactor);
                list.push({
                    sn: transactor[0].toString(),
                    startTime: dayjs(new Date(parseInt(transactor[1].toString()) * 1000)).format("YYYY-MM-DD HH:mm:ss"),
                    endTime: dayjs(new Date(parseInt(transactor[2].toString()) * 1000)).format("YYYY-MM-DD HH:mm:ss"),
                    longitude: parseFloat(transactor[3].toString()) / 1000000,
                    latitude: parseFloat(transactor[4].toString()) / 1000000,
                    deviation: parseFloat(transactor[5].toString()) / 1000000,
                    owner: transactor[6],
                    description: transactor[7],
                    city: transactor[8],
                })
            }
            setMyTransactions(list)
        } catch (e) {
            console.log(e)
        }
    }

    async function onSignIn(nonce, longitude, latitude) {
        try {
            if (ethereum) {
                // console.log("availableTransactions: ");
                const transactionsContract = await createEthereumContract()
                await ethereum.request({ method: "eth_accounts" })
                const transactionHash = await transactionsContract.checkin(nonce, parseInt(longitude), parseInt(latitude))
                setIsLoading(true);
                await transactionHash.wait();
                setIsLoading(false);

            } else {
                console.log("Ethereum is not present")
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function checkIfWalletIsConnect() {
        try {
            // if (!ethereum) return alert("Please install MetaMask.")
            if (!ethereum) return

            const accounts = await ethereum.request({ method: "eth_accounts" })

            console.log("accounts", accounts)
            if (accounts.length) {
                setCurrentAccount(accounts[0])

                getAllTransactions()
                getMyTransactions()
            } else {
                console.log("No accounts found")
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function connectWallet() {
        try {
            if (!ethereum) return alert("Please install MetaMask.")

            const accounts = await ethereum.request({ method: "eth_requestAccounts" })
            console.log(accounts)

            setCurrentAccount(accounts[0])
            // location.reload()
        } catch (error) {
            console.log(error)

            throw new Error("No ethereum object")
        }
    }

    // useEffect(() => {
    //     checkIfWalletIsConnect()
    // }, [transactionCount])

    useEffect(()=>{
        setInterval(()=>{
          console.log("checkIfWalletIsConnectAndGetAllOrders");
          checkIfWalletIsConnect();
        }, 5000);
      }, []);

    return (
        <TransactionContext.Provider
            value={{
                transactionCount,
                connectWallet,
                transactions,
                currentAccount,
                isLoading,
                handleChange,
                formData,
                onSignIn,
                myTransactions,
            }}
        >
            {children}
        </TransactionContext.Provider>
    )
}
