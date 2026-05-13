//POST Update User Wallet

const { handleError } = require("../../middleware/utils");

const updateUserWallet = async (req, res) => {
    try {
        const { id } = req.query;
        const { wallet } = req.body;

        if (![true, false].includes(wallet)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be true or false."
            });
        }

        const user = await updateItem(id, User, { wallet });

        res.status(200).json({
            success: true,
            result: user,
            message: `User wallet status updated to ${wallet} successfully`
        });
    } catch (error) {
        handleError(res, error);
    }
}
