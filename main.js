// Include connections
const BigchainDB = require('bigchaindb-driver')
const API_PATH = 'https://test.ipdb.io/api/v1/'
const conn = new BigchainDB.Connection(API_PATH)

// instead of 10k tokens, i made 10m tokens
const nTokens = 10000000

// init the basics
let tokensLeft
const tokenCreator = new BigchainDB
.Ed25519Keypair(bip39.mnemonicToSeed('seedPhrase').slice(0,32))
let createTxId

//Launches the token in the network
function tokenLaunch() {
    // Construct a transaction payload, wrapping it
    const tx = BigchainDB.Transaction.makeCreateTransaction({
        token: 'TT (tutorial Tokens)',
        number_tokens: nTokens
    },
    // Metadata field, contains information about the transaction itself
    // Can be 'null' if not needed
    {
        datetime: new Date().toDateString()
    },
    // Output: Divisible asset, include nTokens as parameter
    [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(tokenCreator.publicKey), nTokens.toString())],
    tokenCreator.publicKey
    )
    
    // Sign the transaction with the private key of the token creator
    const txSigned = BigchainDB.Transaction.signTransaction(tx, tokenCreator.privateKey)

    // Send the transaction off to bigchaindb
    conn.postTransactionCommit(txSigned).then(res => {
        createTxId = res.id
        tokensLeft = nTokens
        document.body.innerHTML = '<h3>Transaction created successfuly</h3>';
        //txSigned.id corresponds to the asset id of the tokens
        document.body.innerHTML += txSigned.id
    })
}

