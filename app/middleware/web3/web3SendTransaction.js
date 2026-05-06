const User = require('../../models/user')
const { buildErrObject } = require('../../middleware/utils')
const Web3 = require('web3')
/**
 * Checks User model if user with an specific email exists but excluding user id
 * @param {string} id - user id
 * @param {string} email - user email
 */
const web3SendTransaction = (txObject, PrivateAddress) => {
  return new Promise((resolve, reject) => {
    const web3 = new Web3(process.env.URI_MAINNET)
    web3.eth.accounts.signTransaction(
      txObject,
      PrivateAddress,
      async (err, res1) => {
        if (err) {
          // console.log('err', err)
          reject(err)
        } else {
          // console.log('res', res1)
        }
        const raw = res1.rawTransaction
        // console.lo
        // await web3.eth.sendSignedTransaction(raw, async (err, txHash) => {

        //     if (err) {
        //         console.log("🚀 ~ file: approveProduct.js:86 ~ awaitweb3.eth.sendSignedTransaction ~ err:", err)
        //     }
        //     else {
        //         console.log(txHash)

        //         await product.findOneAndUpdate({ _id: req.product_id, 'product_details.product_id': element.product_id }, { 'product_details.$.TxHash': txHash })
        //     }
        // })

        await web3.eth
          .sendSignedTransaction(raw)
          .on('receipt', (receipt) => {
            resolve(receipt)
          })
          .on('error', (err) => {
            reject(false)
            reject(err)
          })
      }
    )
  })
}

module.exports = { web3SendTransaction }
