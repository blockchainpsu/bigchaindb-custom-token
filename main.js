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

// Distribution of tokens
// Sending 2000 tokens to a test user
const amountToSend = 2000
const newUser = new BigchainDB.Ed25519Keypair(bip39.mnemonicToSeed('newUserseedPhrase').slice(0, 32))

// Actual function that transfers the tokens
function transferTokens() {
    // User who will receive the 2000 tokens
    const newUser = new BigchainDB.Ed25519Keypair()

    // Search outputs of the transactions belonging the token creator
    // False argument to retrieve unspent outputs
    conn.getTransaction(createTxId).then((txOutputs) => {
            // Create transfer transaction
            const createTranfer = BigchainDB.Transaction.makeTransferTransaction(
                [{
                    tx: txOutputs,
                    output_index: 0
                }],
                // Transaction output: Two outputs, because the whole input
                // must be spent
                [BigchainDB.Transaction.makeOutput(
                        BigchainDB.Transaction.makeEd25519Condition(tokenCreator.publicKey),
                        (tokensLeft - amountToSend).toString()),
                    BigchainDB.Transaction.makeOutput(
                        BigchainDB.Transaction.makeEd25519Condition(newUser.publicKey),
                        amountToSend)
                ],
                // Metadata (optional)
                {
                    transfer_to: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                    tokens_left: tokensLeft
                }
            )

            // Sign the transaction with the tokenCreator key
            const signedTransfer = BigchainDB.Transaction.signTransaction(createTranfer, tokenCreator.privateKey)
            return conn.postTransactionCommit(signedTransfer)
        }).then(res => {
            // Update tokensLeft
            tokensLeft -= amountToSend
            document.body.innerHTML += '<h3>Transfer transaction created</h3>'
            document.body.innerHTML += res.id
        })
}

// Combination of different BigChainDB transactions
const bestFriend = new driver.Ed25519Keypair() 
function combineTokens(transaction1, outputIndex1, transaction2, outputIndex2, totalTokens) {
    const combineTranfer = BigchainDB.Transaction.makeTransferTransaction(
        [{
            tx: transaction1,
            output_index: outputIndex1
        }, {
            tx: transaction2,
            output_index: outputIndex2
        }],
        // Output
        [BigchainDB.Transaction.makeOutput(
            BigchainDB.Transaction.makeEd25519Condition(bestFriend.publicKey),(totalTokens).toString())], {
            transfer_to: 'my best friend'
        }
    )

    // Sign the transaction with the newUser key
    const signedTransfer = BigchainDB.Transaction.signTransaction(combineTranfer, newUser.privateKey)
    return conn.postTransactionCommit(signedTransfer)

}

